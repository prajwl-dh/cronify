import { startDaemonService } from "../../os/service";

/**
 * CLI command: start
 * Starts the daemon service in the background.
 * This enables task scheduling and API runtime.
 */
export function startCommand() {
  // Start the background daemon process
  startDaemonService();
}
