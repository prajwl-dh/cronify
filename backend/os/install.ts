import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { initConfig } from "../config/config";
import { logger } from "../utils/logger";

/**
 * Installs the Cronify background daemon
 * based on the current operating system.
 */
export function installDaemon() {
  const os = process.platform;

  if (isAlreadyInstalled(os)) {
    logger.info("✅ Cronify is already installed and running.");
    logger.info(
      `\n🌐 Cronify dashboard available at http://127.0.0.1:${initConfig().port}`,
    );
    return;
  }

  const execPath = process.execPath;
  const home = homedir();

  logger.info(`Installing Cronify daemon for OS: ${os}`);

  try {
    // macOS launchd installation
    if (os === "darwin") {
      const plistDir = join(home, "Library", "LaunchAgents");

      if (!existsSync(plistDir)) {
        mkdirSync(plistDir, { recursive: true });
      }

      const plistPath = join(plistDir, "com.cronify.daemon.plist");

      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
        <plist version="1.0">
        <dict>
            <key>Label</key>
            <string>com.cronify.daemon</string>
            <key>ProgramArguments</key>
            <array>
                <string>${execPath}</string>
                <string>daemon</string>
                <string>--internal</string>
            </array>
            <key>RunAtLoad</key>
            <true/>
            <key>KeepAlive</key>
            <true/>
        </dict>
        </plist>`;

      writeFileSync(plistPath, plistContent, "utf-8");

      // Load and start the launchd agent
      spawnSync("launchctl", ["load", plistPath], {
        stdio: "inherit",
      });

      logger.info("✅ macOS launchd agent installed and loaded.");
    }

    // Linux systemd installation
    else if (os === "linux") {
      const systemdDir = join(home, ".config", "systemd", "user");

      if (!existsSync(systemdDir)) {
        mkdirSync(systemdDir, { recursive: true });
      }

      const servicePath = join(systemdDir, "cronify.service");

      const serviceContent = `[Unit]
        Description=Cronify Background Daemon
        After=network.target

        [Service]
        ExecStart=${execPath} daemon --internal
        Restart=always
        RestartSec=10

        [Install]
        WantedBy=default.target`;

      writeFileSync(servicePath, serviceContent, "utf-8");

      // Reload systemd and enable the service
      spawnSync("systemctl", ["--user", "daemon-reload"], {
        stdio: "inherit",
      });

      spawnSync("systemctl", ["--user", "enable", "--now", "cronify.service"], {
        stdio: "inherit",
      });

      logger.info("✅ Linux systemd service installed and started.");
    }

    // Windows scheduled task installation
    else if (os === "win32") {
      const cronifyDir = join(home, ".cronify");

      // Create the Cronify directory if needed
      if (!existsSync(cronifyDir)) {
        mkdirSync(cronifyDir, { recursive: true });
      }

      // Create a hidden VBS launcher for background execution
      const vbsPath = join(cronifyDir, "run_daemon.vbs");

      const vbsContent = `Set WshShell = CreateObject("WScript.Shell")\nWshShell.Run """${execPath}"" daemon --internal", 0, False`;

      writeFileSync(vbsPath, vbsContent, "utf-8");

      // Register the daemon using Windows Task Scheduler
      const schtasksArgs = [
        "/create",
        "/tn",
        "CronifyDaemon",
        "/tr",
        `wscript.exe "${vbsPath}"`,
        "/sc",
        "onlogon",
        "/rl",
        "highest",
        "/f",
      ];

      const result = spawnSync("schtasks", schtasksArgs, {
        stdio: "pipe",
        encoding: "utf-8",
      });

      if (result.status === 0) {
        logger.info("✅ Windows Scheduled Task installed.");

        // Start the daemon immediately
        spawnSync("schtasks", ["/run", "/tn", "CronifyDaemon"], {
          stdio: "ignore",
        });
      } else {
        const stderr = result.stderr || "";

        if (stderr.includes("Access is denied")) {
          logger.error(
            "❌ Access is denied. Please open your terminal as an Administrator and try again.",
          );

          process.exit(1);
        } else {
          throw new Error(`schtasks failed: ${stderr}`);
        }
      }
    }

    // Unsupported operating systems
    else {
      logger.error(`❌ Unsupported OS: ${os}`);
      process.exit(1);
    }

    logger.info(
      "🎉 Cronify installation complete! The daemon is now running in the background.\n",
    );

    logger.info(
      `\n🌐 Cronify dashboard available at http://127.0.0.1:${initConfig().port}`,
    );
  } catch (error) {
    logger.error("❌ Installation failed:", error);
  }
}

/**
 * Checks if cronify background daemon is already installed
 */
function isAlreadyInstalled(os: string): boolean {
  try {
    if (os === "darwin") {
      const result = spawnSync("launchctl", ["list"], { encoding: "utf-8" });
      return result.stdout.includes("com.cronify.daemon");
    }

    if (os === "linux") {
      const result = spawnSync(
        "systemctl",
        ["--user", "is-active", "cronify.service"],
        {
          encoding: "utf-8",
        },
      );
      return result.stdout.trim() === "active";
    }

    if (os === "win32") {
      const result = spawnSync("schtasks", ["/query", "/tn", "CronifyDaemon"], {
        encoding: "utf-8",
      });
      return result.status === 0;
    }

    return false;
  } catch {
    return false;
  }
}
