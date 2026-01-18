const path = require('node:path')
const { app } = require('electron')

if (process.env.HEYNOTE_TEST_USER_DATA_DIR) {
    app.setPath('userData', process.env.HEYNOTE_TEST_USER_DATA_DIR)
}

require(path.join(process.cwd(), 'dist-electron', 'main', 'index.js'))
