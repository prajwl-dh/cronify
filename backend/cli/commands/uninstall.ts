import { stopDaemonService } from '../../os/service';
import { uninstallDaemon } from '../../os/uninstall';

/**
 * CLI command: uninstall
 * Removes the Cronify daemon and all related data.
 *
 * Safety note:
 * Requires explicit confirmation to prevent accidental data loss.
 */
export async function uninstallCommand(values: any) {
  // Warn user about destructive operation
  console.log(
    '⚠️ WARNING: This will completely delete Cronify, your scheduled tasks, and all logs.',
  );

  // Require explicit confirmation flag before proceeding
  if (!values.confirm) {
    console.log('To confirm, run: cronify uninstall --confirm');
    return;
  }

  // Stop running daemon before uninstalling
  stopDaemonService();

  // Perform full cleanup of installation and data
  await uninstallDaemon();
}
