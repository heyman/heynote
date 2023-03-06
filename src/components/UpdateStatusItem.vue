<script>
    export default {
        data() {
            return {
                updateAvailable: false,
                updateDownloaded: false,
                downloading: false,
                updateProgress: {
                    percent: 0.0,
                    transferred: 0.0,
                    total: 0.0,
                    bytesPerSecond: 0.0,
                }
            }
        },

        mounted() {
            window.heynote.autoUpdate.callbacks({
                updateAvailable: (info) => {
                    //console.log("updateAvailable", info)
                    this.updateAvailable = true
                    this.currentVersion = info.currentVersion
                    this.version = info.version
                },
                updateNotAvailable: () => {
                    //console.log("updateNotAvailable")
                },
                updateDownloaded: () => {
                    //console.log("updateDownloaded")
                    this.updateDownloaded = true
                    this.downloading = false
                },
                updateError: (error) => {
                    console.log("Update error", error)
                    this.downloading = false
                },
                updateDownloadProgress: (progress) => {
                    //console.log("updateDownloadProgress", progress)
                    this.downloading = true
                    this.updateProgress = progress
                }
            })    
        },

        computed: {
            updateAvailableTitle() {
                return "Update to version " + this.version + " (current version: " + this.currentVersion + ")"
            },

            restartTitle() {
                return "Click to restart and update Heynote "
            },

            updateProgressPercent() {
                return this.updateProgress.percent.toFixed(0)
            }
        },

        methods: {
            startDownload() {
                window.heynote.autoUpdate.startDownload()
                this.downloading = true
            },

            installAndRestart() {
                window.heynote.autoUpdate.installAndRestart()
            },
        },
        
    }
</script>

<template>
    <div v-if="downloading" class="status-block clickable update-status-block">
        <span class="icon-update"></span>
        Downloading update… {{ updateProgressPercent }}%
    </div>
    <div v-else-if="updateDownloaded" class="status-block clickable update-status-block" @click="installAndRestart" :title="restartTitle">
        <span class="icon-update"></span>
        Update &amp; Restart
    </div>
    <div v-else-if="updateAvailable" class="status-block clickable update-status-block" :title="updateAvailableTitle" @click="startDownload">
        <span class="icon-update"></span>
        New version available!
    </div>
</template>

<style scoped lang="sass">
    =dark-mode()
        @media (prefers-color-scheme: dark)
            @content
    
    .status .status-block.update-status-block
        position: relative
        padding-left: 30px

        .icon-update
            display: block
            position: absolute
            left: 10px
            top: 0
            width: 16px
            height: 22px
            +dark-mode
                opacity: 0.9
            background-size: 16px
            background-repeat: no-repeat
            background-position: center center
            background-image: url("icons/update.svg")
</style>