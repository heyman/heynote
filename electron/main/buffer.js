import fs from "fs"
import { join } from "path"
import { app } from "electron"
import CONFIG from "../config"
import { isDev } from "../detect-platform"
import os from "node:os"
import * as jetpack from "fs-jetpack"

const untildify = (pathWithTilde) => {
    const homeDirectory = os.homedir();
    return homeDirectory
      ? pathWithTilde.replace(/^~(?=$|\/|\\)/, homeDirectory)
      : pathWithTilde;
}

const realpathSync = (path) => {
  try {
    return fs.realpathSync(path);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
  return "";
};

export function getBufferFilePath(path) {
    let defaultPath = app.getPath("userData")
    let configPath = path ? path : CONFIG.get("settings.bufferPath")
    // Expand the given path, preferring the config path to the default.
    let bufferPath = untildify(configPath ? configPath : defaultPath)
    let exists = jetpack.exists(bufferPath);
    // Use the given path if it's an existing file or we will create a new one.
    if (exists === "file" || exists === false) {
      return bufferPath;
    } else if (exists === "dir") { // Use the default file name if a directory is given.
      return join(bufferPath, isDev ? "buffer-dev.txt" : "buffer.txt")
    } else if (exists === "other") { // Follow the symlink
      return realpathSync(bufferPath)
    }
}
