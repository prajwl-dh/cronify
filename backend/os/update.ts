import { spawn, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { arch, homedir, platform } from "node:os";
import { join } from "node:path";
import { logger } from "../utils/logger";
import { startDaemonService, stopDaemonService } from "./service";

const REPO = "prajwl-dh/cronify";
const LATEST_API = `https://api.github.com/repos/${REPO}/releases/latest`;

type Asset = {
  name: string;
  browser_download_url: string;
};

/* ------------------------- MAIN UPDATE ------------------------- */

export async function updateCronify() {
  try {
    logger.info("🔄 Checking for updates...");

    const currentVersion = getCurrentVersion();
    const latest = await fetchLatest();

    logger.info(`📦 Current: ${currentVersion}`);
    logger.info(`🚀 Latest: ${latest.version}`);

    if (!isNewer(latest.version, currentVersion)) {
      logger.info("✅ Already up to date.");
      return;
    }

    const asset = selectAsset(latest.assets);

    if (!asset) {
      throw new Error("No matching release asset found");
    }

    logger.info(`⬇️ Downloading ${asset.name}...`);
    const binaryPath = await downloadAndExtract(asset);

    const installPath = process.execPath;
    const backupPath = `${installPath}.old`;

    logger.info("🛑 Stopping Cronify...");
    await stopDaemonService();

    logger.info("📦 Creating backup...");
    safeBackup(installPath, backupPath);

    try {
      logger.info("⬆️ Installing update...");

      if (process.platform === "win32") {
        await runWindowsUpdater(binaryPath, installPath);

        logger.info("🚪 Exiting current process for Windows update...");
        process.exit(0);
      } else {
        safeReplace(binaryPath, installPath);

        logger.info("🚀 Restarting Cronify...");
        startDaemonService();

        logger.info("🎉 Update successful. Cleaning backup...");
        rmSync(backupPath, { force: true });
      }
    } catch (err) {
      logger.error("❌ Update failed, rolling back...");

      if (existsSync(backupPath)) {
        copyFileSync(backupPath, installPath);
      }

      startDaemonService();

      throw err;
    }
  } catch (err) {
    logger.error("❌ Update error:", err);
  }
}

/* ------------------------- VERSION ------------------------- */

function getCurrentVersion(): string {
  try {
    const res = spawnSync(process.execPath, ["version"], {
      encoding: "utf-8",
    });

    return res.stdout.trim() || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function fetchLatest() {
  const res = await fetch(LATEST_API, {
    headers: {
      "User-Agent": "cronify-updater",
    },
  });

  if (!res.ok) throw new Error("GitHub API failed");

  const data = (await res.json()) as {
    tag_name: string;
    assets: Asset[];
  };

  return {
    version: data.tag_name.replace(/^v/, ""),
    assets: data.assets,
  };
}

function isNewer(latest: string, current: string): boolean {
  const l = latest.split(".").map(Number);
  const c = current.split(".").map(Number);

  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true;
    if ((l[i] || 0) < (c[i] || 0)) return false;
  }

  return false;
}

/* ------------------------- ASSET PICK ------------------------- */

function selectAsset(assets: Asset[]) {
  const os = platform();
  const a = arch();

  let key = "";

  if (os === "linux") key = a === "arm64" ? "linux-arm64" : "linux-x64";
  if (os === "darwin") key = a === "arm64" ? "macos-arm64" : "macos-x64";
  if (os === "win32") key = "windows-x64";

  return assets.find((a) => a.name.includes(key));
}

/* ------------------------- DOWNLOAD + EXTRACT ------------------------- */

async function downloadAndExtract(asset: Asset): Promise<string> {
  const res = await fetch(asset.browser_download_url);

  if (!res.ok || !res.body) {
    throw new Error("Download failed");
  }

  const baseDir = join(homedir(), ".cronify", "tmp");
  const zipPath = join(baseDir, asset.name);
  const extractDir = join(baseDir, "extracted");

  if (!existsSync(baseDir)) {
    mkdirSync(baseDir, { recursive: true });
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(zipPath, buffer);

  extractZip(zipPath, extractDir);

  const bin = findBinary(extractDir);

  if (!bin) {
    throw new Error("Binary not found after extraction");
  }

  return bin;
}

/* ------------------------- ZIP EXTRACTION (NO DEPENDENCY) ------------------------- */

function extractZip(zipPath: string, outDir: string) {
  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true, force: true });
  }
  mkdirSync(outDir, { recursive: true });

  const os = platform();

  let cmd: string;
  let args: string[];

  if (os === "win32") {
    cmd = "tar";
    args = ["-xf", zipPath, "-C", outDir];
  } else {
    cmd = "unzip";
    args = ["-o", zipPath, "-d", outDir];
  }

  const res = spawnSync(cmd, args, { stdio: "inherit" });

  if (res.status !== 0) {
    throw new Error(`Failed to extract zip using ${cmd}`);
  }
}

/* ------------------------- FIND BINARY ------------------------- */

function findBinary(dir: string): string | null {
  const files = readdirSync(dir);

  for (const file of files) {
    const full = join(dir, file);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      const found = findBinary(full);
      if (found) return found;
    } else {
      if (
        file === "cronify" ||
        file === "cronify.exe" ||
        file.includes("cronify")
      ) {
        return full;
      }
    }
  }

  return null;
}

/* ------------------------- SAFE REPLACE ------------------------- */

function safeReplace(src: string, dest: string) {
  copyFileSync(src, dest);
}

/* ------------------------- BACKUP ------------------------- */

function safeBackup(src: string, backup: string) {
  if (existsSync(src)) {
    copyFileSync(src, backup);
  }
}

/* ------------------------- Window Specific Updater ------------------------- */
async function runWindowsUpdater(newBinary: string, installPath: string) {
  const cronifyDir = join(homedir(), ".cronify");

  const batPath = join(cronifyDir, "updater.bat");

  // Stop scheduled task first
  spawnSync("schtasks", ["/end", "/tn", "CronifyDaemon"], {
    stdio: "ignore",
  });

  const bat = `
    @echo off
    setlocal

    echo Waiting for Cronify to exit...
    timeout /t 3 /nobreak >nul

    echo Replacing executable...
    copy /Y "${newBinary}" "${installPath}"

    if errorlevel 1 (
        echo Failed to replace executable
        exit /b 1
    )

    echo Restarting scheduled task...
    schtasks /run /tn "CronifyDaemon"

    echo Cleaning up...
    del "%~f0"
    `;

  writeFileSync(batPath, bat, "utf-8");

  // Launch detached updater
  spawn("cmd.exe", ["/c", batPath], {
    detached: true,
    stdio: "ignore",
  }).unref();
}
