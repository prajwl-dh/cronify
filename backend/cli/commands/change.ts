import { writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { startDaemonService, stopDaemonService } from "../../os/service";
import { logger } from "../../utils/logger";
import { getConfig } from "../lib/config";
import { requireNumber } from "../lib/errors";

/**
 * CLI command: change
 * Updates runtime configuration (currently supports port change)
 * and restarts the daemon service to apply changes.
 */
export function changeCommand(values: any) {
  // Load current configuration
  const config = getConfig();

  // Validate required port argument
  if (!values.port) {
    console.error("❌ Missing --port");
    return;
  }

  // Ensure port is a valid number
  const newPort = requireNumber(values.port, "Invalid port number");

  // Validate port range
  if (newPort < 1 || newPort > 65535) {
    console.error("❌ Port must be between 1 and 65535.");
    return;
  }

  // Path to persisted config file
  const configPath = join(homedir(), ".cronify", "config.json");

  // Merge updated port into existing config
  const updatedConfig = { ...config, port: newPort };

  // Persist updated configuration to disk
  writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), "utf-8");

  logger.info(`Config updated. Port changed to ${newPort}`);
  console.info(`Restarting service...`);

  // Restart daemon to apply new configuration
  stopDaemonService();
  startDaemonService();
}
