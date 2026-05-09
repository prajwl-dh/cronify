import { stopDaemonService } from '../../os/service';

/**
 * CLI command: stop
 * Stops the running daemon service.
 * This disables task execution and background scheduling.
 */
export function stopCommand() {
  // Stop the background daemon process
  stopDaemonService();
}
