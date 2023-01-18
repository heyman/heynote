const os = require('os');

export const isMac = os.platform() === "darwin";
export const isWindows = os.platform() === "win32";
export const isLinux = os.platform() === "linux";

