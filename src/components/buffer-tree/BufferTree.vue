<script>
    import { mapState, mapActions } from "pinia"
    import { SCRATCH_FILE_NAME } from "@/src/common/constants"
    import { useHeynoteStore } from "@/src/stores/heynote-store"
    import { useSettingsStore } from "@/src/stores/settings-store"
    import NewFolderItem from "../folder-selector/NewFolderItem.vue"

    const pathSep = window.heynote.buffer.pathSeparator

    function fileBaseName(path) {
        const filename = path.split(pathSep).at(-1) || path
        return filename.endsWith(".txt") ? filename.slice(0, -4) : filename
    }

    function compareByName(a, b) {
        return a.name.localeCompare(b.name)
    }

    function hasHiddenDirectorySegment(path) {
        return path.split(pathSep).some((segment) => segment.startsWith("."))
    }

    function getInitialOpenState() {
        const settingsStore = useSettingsStore()
        const persisted = settingsStore.settings.bufferTreeOpenFolders
            ?? window.heynote.settings.bufferTreeOpenFolders
        if (!Array.isArray(persisted)) {
            return {}
        }
        return persisted.reduce((state, path) => {
            if (typeof path === "string" && path.length > 0) {
                state[path] = true
            }
            return state
        }, {})
    }

    // Render pipeline:
    // 1) Merge buffers + explicit directory paths into a hierarchical tree.
    // 2) Flatten that tree into visible rows based on folder open state.
    // 3) Inject inline "new folder" row at an anchor near the context-menu source item.
    export default {
        components: {
            NewFolderItem,
        },

        data() {
            return {
                folderOpenState: getInitialOpenState(),
                directoryPaths: [],
                newFolderParentPath: null,
                newFolderAnchorPath: null,
                newFolderAnchorType: null,
                lastContextMenuItem: null,
                backgroundNewFolderPosition: "top",
                draggingBufferPath: null,
                dragOverFolderPath: null,
                selectedItemKey: null,
            }
        },

        async mounted() {
            await Promise.all([
                this.updateBuffers(),
                this.refreshDirectoryList(),
            ])
            this.syncFolderOpenState()
            this.$nextTick(() => this.scrollActiveBufferIntoView())
            if (this.consumeFocusBufferTreeOnMount()) {
                this.$nextTick(() => this.focusTree())
            }
            window._heynote_buffer_tree = this
            window.heynote.mainProcess.on("bufferTree:createFolder", this.onCreateFolderRequested)
        },

        beforeUnmount() {
            if (window._heynote_buffer_tree === this) {
                window._heynote_buffer_tree = null
            }
            window.heynote.mainProcess.off("bufferTree:createFolder", this.onCreateFolderRequested)
        },

        watch: {
            buffers: {
                deep: true,
                handler() {
                    this.refreshDirectoryList()
                    this.syncFolderOpenState()
                },
            },
            currentBufferPath() {
                this.openCurrentPathFolders()
                this.persistFolderOpenState()
                this.selectCurrentBuffer()
                this.$nextTick(() => this.scrollActiveBufferIntoView())
            },
            bufferTreeFocusRequestId() {
                this.$nextTick(() => this.focusTree())
            },
        },

        computed: {
            ...mapState(useHeynoteStore, [
                "buffers",
                "currentBufferPath",
                "bufferTreeFocusRequestId",
            ]),

            visibleItems() {
                const rows = []
                const walk = (folder, level, folderPath) => {
                    const isTargetFolder = this.newFolderParentPath === folderPath
                    const anchorIsFolder = this.newFolderAnchorType === "folder" && this.newFolderAnchorPath === folderPath
                    const isRootFolder = folderPath === ""
                    const insertAtRootTop = isRootFolder && this.newFolderAnchorType === "root-top"
                    const insertAtRootBottom = isRootFolder && this.newFolderAnchorType === "root-bottom"

                    // Inline new-folder input is inserted relative to where context menu was opened.
                    if (isTargetFolder && (anchorIsFolder || insertAtRootTop || (!this.newFolderAnchorPath && !isRootFolder))) {
                        rows.push({
                            type: "new-folder",
                            path: folderPath,
                            level,
                        })
                    }

                    const folders = [...folder.folders].sort(compareByName)
                    const files = [...folder.files].sort(compareByName)
                    for (const childFolder of folders) {
                        rows.push({
                            type: "folder",
                            path: childFolder.path,
                            name: childFolder.name,
                            level,
                            open: !!this.folderOpenState[childFolder.path],
                        })
                        if (this.folderOpenState[childFolder.path]) {
                            walk(childFolder, level + 1, childFolder.path)
                        }
                    }
                    for (const file of files) {
                        rows.push({
                            type: "buffer",
                            path: file.path,
                            name: file.name,
                            level,
                            active: file.path === this.currentBufferPath,
                            scratch: file.path === SCRATCH_FILE_NAME,
                        })
                        if (
                            isTargetFolder &&
                            this.newFolderAnchorType === "buffer" &&
                            this.newFolderAnchorPath === file.path
                        ) {
                            rows.push({
                                type: "new-folder",
                                path: folderPath,
                                level,
                            })
                        }
                    }

                    if (
                        isTargetFolder &&
                        this.newFolderAnchorPath &&
                        this.newFolderAnchorType === "buffer" &&
                        !files.some((file) => file.path === this.newFolderAnchorPath)
                    ) {
                        rows.push({
                            type: "new-folder",
                            path: folderPath,
                            level,
                        })
                    }

                    if (isTargetFolder && insertAtRootBottom) {
                        rows.push({
                            type: "new-folder",
                            path: folderPath,
                            level,
                        })
                    }
                }

                walk(this.buildTree(), 0, "")
                return rows
            },

            selectableItems() {
                return this.visibleItems.filter((item) => this.isSelectableItem(item))
            },
        },

        methods: {
            ...mapActions(useHeynoteStore, [
                "updateBuffers",
                "openBuffer",
                "createDirectory",
                "moveBuffer",
                "focusEditor",
                "consumeFocusBufferTreeOnMount",
            ]),

            async refreshDirectoryList() {
                const directories = await window.heynote.buffer.getDirectoryList()
                this.directoryPaths = directories.filter((path) => !hasHiddenDirectorySegment(path))
            },

            isSelectableItem(item) {
                return item?.type === "folder" || item?.type === "buffer"
            },

            itemKey(item) {
                return item ? `${item.type}:${item.path}` : null
            },

            findSelectableItemByKey(key) {
                return this.selectableItems.find((item) => this.itemKey(item) === key)
            },

            getSelectedItemIndex() {
                this.ensureSelectedItem()
                return this.selectableItems.findIndex((item) => this.itemKey(item) === this.selectedItemKey)
            },

            ensureSelectedItem() {
                if (this.selectableItems.length === 0) {
                    this.selectedItemKey = null
                    return
                }
                if (this.findSelectableItemByKey(this.selectedItemKey)) {
                    return
                }
                const activeBuffer = this.selectableItems.find((item) => item.type === "buffer" && item.path === this.currentBufferPath)
                this.selectedItemKey = this.itemKey(activeBuffer || this.selectableItems[0])
            },

            selectCurrentBuffer() {
                const activeBuffer = this.selectableItems.find((item) => item.type === "buffer" && item.path === this.currentBufferPath)
                if (activeBuffer) {
                    this.selectedItemKey = this.itemKey(activeBuffer)
                }
            },

            setSelectedItem(item) {
                this.selectedItemKey = this.itemKey(item)
                this.$nextTick(() => this.scrollSelectedItemIntoView())
            },

            onTreeFocus() {
                this.ensureSelectedItem()
            },

            focusTree() {
                this.ensureSelectedItem()
                this.$refs.container?.focus({ preventScroll: true })
                this.$nextTick(() => this.scrollSelectedItemIntoView())
            },

            onTreeKeyDown(event) {
                if (event.key === "Escape") {
                    event.preventDefault()
                    this.focusEditor()
                    return
                }
                if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Enter"].includes(event.key)) {
                    return
                }
                this.ensureSelectedItem()
                const selectedIndex = this.getSelectedItemIndex()
                const selectedItem = this.selectableItems[selectedIndex]
                if (!selectedItem) {
                    return
                }

                if (event.key === "ArrowDown") {
                    event.preventDefault()
                    this.setSelectedItem(this.selectableItems[Math.min(selectedIndex + 1, this.selectableItems.length - 1)])
                } else if (event.key === "ArrowUp") {
                    event.preventDefault()
                    this.setSelectedItem(this.selectableItems[Math.max(selectedIndex - 1, 0)])
                } else if (event.key === "ArrowRight") {
                    event.preventDefault()
                    if (selectedItem.type === "folder" && !selectedItem.open) {
                        this.folderOpenState[selectedItem.path] = true
                        this.persistFolderOpenState()
                    }
                } else if (event.key === "ArrowLeft") {
                    event.preventDefault()
                    if (selectedItem.type === "folder" && selectedItem.open) {
                        this.folderOpenState[selectedItem.path] = false
                        this.persistFolderOpenState()
                    }
                } else if (event.key === "Enter") {
                    event.preventDefault()
                    if (selectedItem.type === "buffer") {
                        this.openBuffer(selectedItem.path)
                    }
                }
            },

            buildTree() {
                const root = {
                    path: "",
                    folders: [],
                    files: [],
                }
                const getOrCreateFolder = (parent, name, path) => {
                    let folder = parent.folders.find((item) => item.path === path)
                    if (!folder) {
                        folder = {
                            name,
                            path,
                            folders: [],
                            files: [],
                        }
                        parent.folders.push(folder)
                    }
                    return folder
                }

                // Include explicit directory entries so empty folders appear in the tree.
                for (const directoryPath of this.directoryPaths) {
                    if (!directoryPath) {
                        continue
                    }
                    const parts = directoryPath.split(pathSep)
                    let current = root
                    let currentPath = ""
                    for (const folderName of parts) {
                        currentPath = currentPath ? currentPath + pathSep + folderName : folderName
                        current = getOrCreateFolder(current, folderName, currentPath)
                    }
                }

                // Then attach all buffers to their directory nodes.
                for (const [bufferPath, metadata] of Object.entries(this.buffers)) {
                    const parts = bufferPath.split(pathSep)
                    const filename = parts.pop()
                    if (parts.some((part) => part.startsWith("."))) {
                        continue
                    }
                    let current = root
                    let currentPath = ""
                    for (const folderName of parts) {
                        currentPath = currentPath ? currentPath + pathSep + folderName : folderName
                        current = getOrCreateFolder(current, folderName, currentPath)
                    }

                    current.files.push({
                        path: bufferPath,
                        name: metadata?.name || fileBaseName(filename || bufferPath),
                    })
                }
                return root
            },

            getFolderPaths() {
                const folderPaths = []
                for (const path of this.directoryPaths) {
                    folderPaths.push(path)
                }
                for (const path of Object.keys(this.buffers)) {
                    const parts = path.split(pathSep).slice(0, -1)
                    let currentPath = ""
                    for (const folderName of parts) {
                        currentPath = currentPath ? currentPath + pathSep + folderName : folderName
                        folderPaths.push(currentPath)
                    }
                }
                return [...new Set(folderPaths)]
            },

            openCurrentPathFolders() {
                const parts = (this.currentBufferPath || "").split(pathSep).slice(0, -1)
                let currentPath = ""
                for (const folderName of parts) {
                    currentPath = currentPath ? currentPath + pathSep + folderName : folderName
                    this.folderOpenState[currentPath] = true
                }
            },

            syncFolderOpenState() {
                const nextState = {}
                for (const path of this.getFolderPaths()) {
                    nextState[path] = this.folderOpenState[path] ?? false
                }
                this.folderOpenState = nextState
                this.openCurrentPathFolders()
                this.persistFolderOpenState()
            },

            onFolderClick(path) {
                this.folderOpenState[path] = !this.folderOpenState[path]
                this.persistFolderOpenState()
            },

            onItemClick(item) {
                this.setSelectedItem(item)
                if (item.type === "folder") {
                    this.onFolderClick(item.path)
                } else {
                    this.openBuffer(item.path)
                    this.focusTree()
                }
            },

            persistFolderOpenState() {
                const settingsStore = useSettingsStore()
                const openFolders = Object.keys(this.folderOpenState)
                    .filter((path) => this.folderOpenState[path])
                    .sort()
                const persisted = [...(settingsStore.settings.bufferTreeOpenFolders || [])].sort()
                if (JSON.stringify(openFolders) === JSON.stringify(persisted)) {
                    return
                }
                settingsStore.updateSettings({
                    bufferTreeOpenFolders: openFolders,
                })
            },

            onItemContextMenu(item, event) {
                if (window.heynote.platform.isWebApp) {
                    return
                }
                event.preventDefault()
                this.lastContextMenuItem = {
                    type: item.type,
                    path: item.path,
                }
                if (item.type === "buffer") {
                    window.heynote.mainProcess.invoke("showBufferTreeContextMenu", item.path)
                } else if (item.type === "folder") {
                    window.heynote.mainProcess.invoke("showBufferTreeDirectoryContextMenu", item.path)
                }
            },

            onBackgroundContextMenu(event) {
                if (window.heynote.platform.isWebApp) {
                    return
                }
                if (event.target.closest(".item") || event.target.closest("input")) {
                    return
                }
                event.preventDefault()
                // For root-level "New Folder..." from empty-space context menu, place input at top or bottom.
                this.backgroundNewFolderPosition = this.getBackgroundInsertPosition(event.clientY)
                this.lastContextMenuItem = null
                window.heynote.mainProcess.invoke("showBufferTreeBackgroundContextMenu")
            },

            getBackgroundInsertPosition(clickY) {
                const itemElements = [...(this.$el?.querySelectorAll(".item") || [])]
                if (itemElements.length === 0) {
                    return "top"
                }
                const firstRect = itemElements[0].getBoundingClientRect()
                const lastRect = itemElements[itemElements.length - 1].getBoundingClientRect()
                if (clickY <= firstRect.top) {
                    return "top"
                }
                if (clickY >= lastRect.bottom) {
                    return "bottom"
                }
                const distTop = Math.abs(clickY - firstRect.top)
                const distBottom = Math.abs(lastRect.bottom - clickY)
                return distTop <= distBottom ? "top" : "bottom"
            },

            onCreateFolderRequested(event, parentPath) {
                this.newFolderParentPath = parentPath || ""
                this.newFolderAnchorPath = null
                this.newFolderAnchorType = null

                // If create-folder came from an item context menu, anchor inline input next to that item.
                if (this.lastContextMenuItem) {
                    if (
                        this.lastContextMenuItem.type === "folder" &&
                        this.lastContextMenuItem.path === this.newFolderParentPath
                    ) {
                        this.newFolderAnchorPath = this.lastContextMenuItem.path
                        this.newFolderAnchorType = "folder"
                    } else if (this.lastContextMenuItem.type === "buffer") {
                        const bufferParentPath = this.lastContextMenuItem.path.split(pathSep).slice(0, -1).join(pathSep)
                        if (bufferParentPath === this.newFolderParentPath) {
                            this.newFolderAnchorPath = this.lastContextMenuItem.path
                            this.newFolderAnchorType = "buffer"
                        }
                    }
                } else if (this.newFolderParentPath === "") {
                    this.newFolderAnchorType = this.backgroundNewFolderPosition === "bottom" ? "root-bottom" : "root-top"
                }

                if (this.newFolderParentPath) {
                    const parts = this.newFolderParentPath.split(pathSep)
                    let currentPath = ""
                    for (const folderName of parts) {
                        currentPath = currentPath ? currentPath + pathSep + folderName : folderName
                        this.folderOpenState[currentPath] = true
                    }
                    this.persistFolderOpenState()
                }
            },

            async onCreateFolder(parentPath, name) {
                const path = parentPath ? parentPath + pathSep + name : name
                await this.createDirectory(path)
                await this.refreshDirectoryList()
                this.newFolderParentPath = null
                this.newFolderAnchorPath = null
                this.newFolderAnchorType = null
            },

            onCancelCreateFolder() {
                this.newFolderParentPath = null
                this.newFolderAnchorPath = null
                this.newFolderAnchorType = null
            },

            getParentPath(path) {
                return path.split(pathSep).slice(0, -1).join(pathSep)
            },

            buildPath(parentPath, filename) {
                return parentPath ? parentPath + pathSep + filename : filename
            },

            canMoveBufferToDirectory(bufferPath, targetDirectory) {
                if (!bufferPath || bufferPath === SCRATCH_FILE_NAME) {
                    return false
                }
                const sourceDirectory = this.getParentPath(bufferPath)
                if (sourceDirectory === targetDirectory) {
                    return false
                }
                const filename = bufferPath.split(pathSep).at(-1)
                const targetPath = this.buildPath(targetDirectory, filename)
                return !this.buffers[targetPath]
            },

            onBufferDragStart(path, event) {
                if (!path || path === SCRATCH_FILE_NAME) {
                    event.preventDefault()
                    return
                }
                this.draggingBufferPath = path
                this.dragOverFolderPath = null
                event.dataTransfer.effectAllowed = "move"
                event.dataTransfer.setData("text/plain", path)
            },

            onBufferDragEnd() {
                this.draggingBufferPath = null
                this.dragOverFolderPath = null
                this.$nextTick(() => this.focusEditor())
            },

            onFolderDragOver(path, event) {
                if (!this.draggingBufferPath || !this.canMoveBufferToDirectory(this.draggingBufferPath, path)) {
                    this.dragOverFolderPath = null
                    return
                }
                event.preventDefault()
                event.dataTransfer.dropEffect = "move"
                this.dragOverFolderPath = path
            },

            async onFolderDrop(path, event) {
                if (!this.draggingBufferPath || !this.canMoveBufferToDirectory(this.draggingBufferPath, path)) {
                    return
                }
                event.preventDefault()
                const sourcePath = this.draggingBufferPath
                const filename = sourcePath.split(pathSep).at(-1)
                const targetPath = this.buildPath(path, filename)
                await this.moveBuffer(sourcePath, targetPath)
                this.draggingBufferPath = null
                this.dragOverFolderPath = null
            },

            onBufferDragOver(path, event) {
                if (!this.draggingBufferPath) {
                    this.dragOverFolderPath = null
                    return
                }
                const targetDirectory = this.getParentPath(path)
                if (!this.canMoveBufferToDirectory(this.draggingBufferPath, targetDirectory)) {
                    this.dragOverFolderPath = null
                    return
                }
                event.preventDefault()
                event.dataTransfer.dropEffect = "move"
                this.dragOverFolderPath = targetDirectory
            },

            async onBufferDrop(path, event) {
                if (!this.draggingBufferPath) {
                    return
                }
                const targetDirectory = this.getParentPath(path)
                if (!this.canMoveBufferToDirectory(this.draggingBufferPath, targetDirectory)) {
                    return
                }
                event.preventDefault()
                const sourcePath = this.draggingBufferPath
                const filename = sourcePath.split(pathSep).at(-1)
                const targetPath = this.buildPath(targetDirectory, filename)
                await this.moveBuffer(sourcePath, targetPath)
                this.draggingBufferPath = null
                this.dragOverFolderPath = null
            },

            onTreeDragOver(event) {
                if (!this.draggingBufferPath) {
                    this.dragOverFolderPath = null
                    return
                }
                if (event.target.closest(".item")) {
                    return
                }
                if (!this.canMoveBufferToDirectory(this.draggingBufferPath, "")) {
                    this.dragOverFolderPath = null
                    return
                }
                event.preventDefault()
                event.dataTransfer.dropEffect = "move"
                this.dragOverFolderPath = ""
            },

            async onTreeDrop(event) {
                if (!this.draggingBufferPath) {
                    return
                }
                if (event.target.closest(".item")) {
                    return
                }
                if (!this.canMoveBufferToDirectory(this.draggingBufferPath, "")) {
                    this.dragOverFolderPath = null
                    return
                }
                event.preventDefault()
                const sourcePath = this.draggingBufferPath
                const filename = sourcePath.split(pathSep).at(-1)
                const targetPath = this.buildPath("", filename)
                await this.moveBuffer(sourcePath, targetPath)
                this.draggingBufferPath = null
                this.dragOverFolderPath = null
            },

            scrollActiveBufferIntoView() {
                const activeBuffer = this.$el?.querySelector(".buffer.active")
                if (!activeBuffer) {
                    return
                }
                activeBuffer.scrollIntoView({
                    behavior: "auto",
                    block: "nearest",
                })
            },

            scrollSelectedItemIntoView() {
                const selectedItem = this.$el?.querySelector(".item.selected")
                if (!selectedItem) {
                    return
                }
                selectedItem.scrollIntoView({
                    behavior: "auto",
                    block: "nearest",
                })
            },

            indentGuides(level) {
                return Array.from({ length: Math.max(0, level) }, (_, index) => index)
            },
        },

    }
</script>

<template>
    <div
        :class="{ 'buffer-tree': true, 'root-drop-target': draggingBufferPath && dragOverFolderPath === '' }"
        ref="container"
        tabindex="0"
        role="tree"
        @contextmenu="onBackgroundContextMenu"
        @focus="onTreeFocus"
        @keydown="onTreeKeyDown"
        @dragover="onTreeDragOver"
        @drop="onTreeDrop"
    >
        <template v-for="item in visibleItems" :key="item.type + ':' + item.path + ':' + item.level">
            <NewFolderItem
                v-if="item.type === 'new-folder'"
                :parentPath="item.path"
                :level="item.level"
                :showIndentGuides="true"
                @create-folder="onCreateFolder"
                @cancel="onCancelCreateFolder"
            />
            <div
                v-else
                :class="{
                    item: true,
                    folder: item.type === 'folder',
                    buffer: item.type === 'buffer',
                    open: item.open,
                    active: item.active,
                    scratch: item.scratch,
                    selected: itemKey(item) === selectedItemKey,
                    'drop-target': item.type === 'folder' && dragOverFolderPath === item.path,
                }"
                :style="{ '--indent-level': item.level }"
                :draggable="item.type === 'buffer' && !item.scratch"
                role="treeitem"
                :aria-expanded="item.type === 'folder' ? String(!!item.open) : undefined"
                :aria-selected="itemKey(item) === selectedItemKey ? 'true' : 'false'"
                @click="onItemClick(item)"
                @contextmenu.stop="onItemContextMenu(item, $event)"
                @dragstart="item.type === 'buffer' ? onBufferDragStart(item.path, $event) : null"
                @dragend="item.type === 'buffer' ? onBufferDragEnd() : null"
                @dragover="item.type === 'folder' ? onFolderDragOver(item.path, $event) : item.type === 'buffer' ? onBufferDragOver(item.path, $event) : null"
                @drop="item.type === 'folder' ? onFolderDrop(item.path, $event) : item.type === 'buffer' ? onBufferDrop(item.path, $event) : null"
            >
                <span
                    v-for="guideLevel in indentGuides(item.level)"
                    :key="guideLevel"
                    class="indent-guide"
                    :style="{ '--guide-level': guideLevel }"
                ></span>
                <span class="name" :title="item.name">{{ item.name }}</span>
            </div>
        </template>
    </div>
</template>

<style lang="sass" scoped>
    .buffer-tree
        height: 100%
        min-height: 0
        max-height: 100%
        overflow-y: auto
        overflow-x: hidden
        padding: 4px 0
        box-sizing: border-box
        &:focus
            outline: none
            .item.selected
                outline: 1px solid var(--ui-accent)
                outline-offset: -1px
                z-index: 1
        &.root-drop-target
            background: rgba(0,0,0, 0.05)
            +dark-mode
                background: rgba(255,255,255, 0.08)

    .item
        user-select: none
        font-size: 13px
        line-height: 20px
        padding: 2px 10px
        scroll-margin-top: 36px
        scroll-margin-bottom: 36px
        padding-left: calc(24px + var(--indent-level) * 20px)
        //border-radius: 4px
        position: relative
        white-space: nowrap
        overflow: hidden
        text-overflow: ellipsis
        cursor: pointer
        color: rgba(0,0,0, 0.6)
        +dark-mode
            color: rgba(255,255,255, 0.6)
        &.buffer
            padding-left: calc(13px + var(--indent-level) * 20px)
            &:hover
                background-color: rgba(0,0,0, 0.06)
                +dark-mode
                    background-color: rgba(255,255,255, 0.08)
            &.active
                background-color: var(--ui-buffer-tree-selected)
                +dark-mode
                    background-color: var(--ui-buffer-tree-selected)
            &.scratch
                font-style: italic
        &.folder
            background-image: url('@/assets/icons/caret-right.svg')
            background-size: 12px
            background-repeat: no-repeat
            background-position-x: calc(9px + var(--indent-level) * 20px)
            background-position-y: 6px
            +dark-mode
                background-image: url('@/assets/icons/caret-right-white.svg')
            &:hover
                background-color: rgba(0,0,0, 0.06)
                +dark-mode
                    background-color: rgba(255,255,255, 0.08)
            &.open
                background-image: url('@/assets/icons/caret-down.svg')
                +dark-mode
                    background-image: url('@/assets/icons/caret-down-white.svg')
            &.drop-target
                background-color: rgba(0,0,0, 0.10)
                +dark-mode
                    background-color: rgba(255,255,255, 0.16)

    .indent-guide
        position: absolute
        top: 0
        bottom: 0
        left: calc(14px + var(--guide-level) * 20px)
        width: 1px
        opacity: 0
        pointer-events: none
        background: rgba(0,0,0, 0.14)
        transition: opacity 80ms ease
        +dark-mode
            background: rgba(255,255,255, 0.18)

    .buffer-tree:hover .indent-guide,
    :global(.left-panel:hover) .buffer-tree .indent-guide
        opacity: 1

    .buffer-tree:hover :deep(.show-indent-guides .indent-guide),
    :global(.left-panel:hover) .buffer-tree :deep(.show-indent-guides .indent-guide)
        opacity: 1

    .name
        display: block
        position: relative
</style>
