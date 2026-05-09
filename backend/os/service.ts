import { spawnSync } from 'node:child_process';
import { initConfig } from '../config/config';
import { logger } from '../utils/logger';

/**
 * Starts the Cronify daemon service
 * using the native service manager
 * for the current operating system.
 */
export function startDaemonService() {
  const os = process.platform;

  logger.info('🚀 Telling the Operating System to start Cronify...');

  try {
    // macOS launchd service
    if (os === 'darwin') {
      spawnSync('launchctl', ['start', 'com.cronify.daemon'], {
        stdio: 'inherit',
      });
    }

    // Linux systemd service
    else if (os === 'linux') {
      spawnSync('systemctl', ['--user', 'start', 'cronify.service'], {
        stdio: 'inherit',
      });
    }

    // Windows scheduled task
    if (os === 'win32') {
      const result = spawnSync('schtasks', ['/run', '/tn', 'CronifyDaemon'], {
        stdio: 'pipe',
        encoding: 'utf-8',
      });

      if (result.status !== 0) {
        throw new Error(result.stderr || 'Failed to start task');
      }
    }

    logger.info('✅ OS Service started.');
  } catch (error) {
    logger.error('❌ Failed to start OS service. Is it installed?', error);
  }
}

/**
 * Stops the Cronify daemon service gracefully.
 */
export async function stopDaemonService() {
  const os = process.platform;
  const config = initConfig();

  logger.info('🛑 Telling the Operating System to stop Cronify...');

  try {
    // macOS launchd service
    if (os === 'darwin') {
      spawnSync('launchctl', ['stop', 'com.cronify.daemon'], {
        stdio: 'inherit',
      });

      // Send shutdown signal to the running daemon
      try {
        await fetch(`http://127.0.0.1:${config.port}/api/shutdown`, {
          method: 'POST',
        });

        await new Promise((r) => setTimeout(r, 1500));
      } catch (e) {
        logger.warn('Daemon may already be stopped');
      }
    }

    // Linux systemd service
    else if (os === 'linux') {
      spawnSync('systemctl', ['--user', 'stop', 'cronify.service'], {
        stdio: 'inherit',
      });
    }

    // Windows scheduled task
    if (os === 'win32') {
      try {
        await fetch(`http://127.0.0.1:${config.port}/api/shutdown`, {
          method: 'POST',
        });

        await new Promise((r) => setTimeout(r, 1500));
      } catch (e) {
        logger.warn('Daemon may already be stopped');
      }

      logger.info('✅ Shutdown request sent');
    }

    logger.info('✅ OS Service stopped gracefully.');
  } catch (error) {
    logger.error('❌ Failed to stop OS service.', error);
  }
}
