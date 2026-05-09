import { installDaemon } from '../../os/install';

/**
 * CLI command: install
 * Installs the daemon service on the system.
 * Typically sets up background execution for Cronify.
 */
export function installCommand() {
  // Trigger OS-level daemon installation
  installDaemon();
}
