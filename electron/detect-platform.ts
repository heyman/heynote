import os from 'os';

export const isDev = !!process.env.VITE_DEV_SERVER_URL

export const isMac = os.platform() === "darwin";
export const isWindows = os.platform() === "win32";
export const isLinux = os.platform() === "linux";
