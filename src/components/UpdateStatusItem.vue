<script>
    export default {
        props: [
            "autoUpdate",
            "allowBetaVersions",
        ],
        
        data() {
            return {
                updateAvailable: false,
                updateDownloaded: false,
                downloading: false,
                checkingForUpdate: false,
                updateProgress: {
                    percent: 0.0,
                    transferred: 0.0,
                    total: 0.0,
                    bytesPerSecond: 0.0,
                },
                checkForUpdateIntervalId: null,
            }
        },

        mounted() {
            window.heynote.autoUpdate.callbacks({
                updateAvailable: (info) => {
                    //console.log("updateAvailable", info)
                    this.checkingForUpdate = false
                    this.updateAvailable = true
                    this.currentVersion = info.currentVersion
                    this.version = info.version
                },
                updateNotAvailable: () => {
                    //console.log("updateNotAvailable")
                    this.checkingForUpdate = false
                },
                updateDownloaded: () => {
                    //console.log("updateDownloaded")
                    this.updateDownloaded = true
                    this.downloading = false
                },
                updateError: (error) => {
                    console.log("Update error", error)
                    this.checkingForUpdate = false
                    this.downloading = false
                },
                updateDownloadProgress: (progress) => {
                    //console.log("updateDownloadProgress", progress)
                    this.downloading = true
                    this.updateProgress = progress
                }
            })
        },

        beforeUnmount() {
            if (this.checkForUpdateIntervalId) {
                clearInterval(this.checkForUpdateIntervalId)
            }
        },

        watch: {
            autoUpdate: {
                immediate: true,
                handler(autoUpdate) {
                    if (this.checkForUpdateIntervalId) {
                        clearInterval(this.checkForUpdateIntervalId)
                    }
                    if (autoUpdate) {
                        // check for update now
                        this.checkForUpdate()
                        
                        // check for updates every 8 hours
                        this.checkForUpdateIntervalId = setInterval(() => {
                            this.checkForUpdate()
                        }, 1000 * 3600 * 8)
                    }
                },
            },

            allowBetaVersions(newValue) {
                this.checkForUpdate()
            },
        },

        computed: {
            statusText() {
                if (this.downloading) {
                    return "Downloading update… " + this.updateProgress.percent.toFixed(0) + "%"
                } else if (this.updateDownloaded) {
                    return "Update & Restart"
                } else if (this.updateAvailable) {
                    return "New version available!"
                } else {
                    return ""
                }
            },

            statusTitle() {
                if (this.downloading) {
                    return ""
                } else if (this.updateDownloaded) {
                    return "Click to restart and update Heynote"
                } else if (this.updateAvailable) {
                    return "Update to version " + this.version + " (current version: " + this.currentVersion + ")"
                } else {
                    return "Check for updates"
                }
            },

            className() {
                return "status-block update-status-block" + 
                    (!this.downloading ? " clickable" : "") +
                    (this.statusText === "" ? " empty" : "")
            },

            iconClassName() {
                if (this.checkingForUpdate) {
                    return "icon-update spinning"
                } else if (this.downloading) {
                    return "icon-update spinning"
                } else if (this.updateDownloaded) {
                    return "icon-update icon-download "
                } else if (this.updateAvailable) {
                    return "icon-update icon-download"
                } else {
                    return "icon-update"
                }
            },
        },

        methods: {
            onClick() {
                if (this.downloading || this.checkingForUpdate) {
                    return
                } else if (this.updateDownloaded) {
                    window.heynote.autoUpdate.installAndRestart()
                } else if (this.updateAvailable) {
                    this.downloading = true
                    window.heynote.autoUpdate.startDownload()
                } else {
                    this.checkForUpdate()
                }
            },

            checkForUpdate() {
                this.updateAvailable = false
                this.checkingForUpdate = true
                window.heynote.autoUpdate.checkForUpdates()
            }
        },
        
    }
</script>

<template>
    <div :class="className" @click="onClick" :title="statusTitle">
        <span :class="iconClassName"></span>
        {{  statusText }}
    </div>
</template>

<style scoped lang="sass">
    @keyframes spin
        from
            transform: rotate(0deg)
        to
            transform: rotate(360deg)
    
    .status .status-block.update-status-block
        position: relative
        padding-left: 28px
        &.empty
            padding-left: 24px

        .icon-update
            display: block
            position: absolute
            left: 10px
            top: 4px
            width: 14px
            height: 14px
            +dark-mode
                opacity: 0.9
            background-size: 14px
            background-repeat: no-repeat
            background-position: center center
            background-image: url("@/assets/icons/update.svg")
            animation-name: spin
            animation-duration: 2000ms
            animation-iteration-count: infinite
            animation-timing-function: linear
            animation-play-state: paused
            &.icon-download
                background-image: url("@/assets/icons/download.svg")
                width: 16px
                height: 16px
                background-size: 16px
                top: 3px
                animation: none
            &.spinning
                animation-play-state: running
                
</style>