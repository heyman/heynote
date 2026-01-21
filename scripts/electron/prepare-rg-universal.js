const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rgModuleRoot = path.dirname(
    require.resolve("@vscode/ripgrep/package.json")
);
const postinstallPath = path.join(rgModuleRoot, "lib", "postinstall.js");
const downloadPath = path.join(rgModuleRoot, "lib", "download.js");

const postinstallSource = fs.readFileSync(postinstallPath, "utf8");
const versionMatch = postinstallSource.match(/const VERSION = '([^']+)'/);
if (!versionMatch) {
    throw new Error("prepare-rg-universal: failed to read ripgrep version");
}

const rgVersion = versionMatch[1];
const download = require(downloadPath);

async function downloadRg(target) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "heynote-rg-"));
    await download({
        version: rgVersion,
        target,
        destDir: tempDir,
        force: true,
        token: process.env.GITHUB_TOKEN,
    });
    return path.join(tempDir, "rg");
}

async function main() {
    if (process.platform !== "darwin") {
        return;
    }

    const x64Path = await downloadRg("x86_64-apple-darwin");
    const arm64Path = await downloadRg("aarch64-apple-darwin");

    const destPath = path.join(rgModuleRoot, "bin", "rg");
    const lipoResult = spawnSync(
        "lipo",
        ["-create", "-output", destPath, x64Path, arm64Path],
        { stdio: "inherit" }
    );

    if (lipoResult.status !== 0) {
        throw new Error("prepare-rg-universal: lipo failed");
    }

    fs.chmodSync(destPath, 0o755);

    const rgVersionResult = spawnSync(destPath, ["--version"], {
        stdio: "inherit",
    });
    if (rgVersionResult.status !== 0) {
        throw new Error("prepare-rg-universal: rg --version failed");
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
