import { spawnSync } from 'node:child_process';
import { logger } from '../utils/logger';

export function startDaemonService() {
  const os = process.platform;
  logger.info('🚀 Telling the Operating System to start Cronify...');

  try {
    if (os === 'darwin') {
      spawnSync('launchctl', ['start', 'com.cronify.daemon'], {
        stdio: 'inherit',
      });
    } else if (os === 'linux') {
      spawnSync('systemctl', ['--user', 'start', 'cronify.service'], {
        stdio: 'inherit',
      });
    } else if (os === 'win32') {
      spawnSync('schtasks', ['/run', '/tn', 'CronifyDaemon'], {
        stdio: 'inherit',
      });
    }
    logger.info('✅ OS Service started.');
  } catch (error) {
    logger.error('❌ Failed to start OS service. Is it installed?', error);
  }
}

export function stopDaemonService() {
  const os = process.platform;
  logger.info('🛑 Telling the Operating System to stop Cronify...');

  try {
    if (os === 'darwin') {
      spawnSync('launchctl', ['stop', 'com.cronify.daemon'], {
        stdio: 'inherit',
      });
    } else if (os === 'linux') {
      spawnSync('systemctl', ['--user', 'stop', 'cronify.service'], {
        stdio: 'inherit',
      });
    } else if (os === 'win32') {
      spawnSync('schtasks', ['/end', '/tn', 'CronifyDaemon'], {
        stdio: 'ignore',
      });
    }
    logger.info('✅ OS Service stopped gracefully.');
  } catch (error) {
    logger.error('❌ Failed to stop OS service.', error);
  }
}
