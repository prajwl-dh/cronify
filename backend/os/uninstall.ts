import { spawn, spawnSync } from 'node:child_process';

import {
  existsSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';

import { homedir } from 'node:os';
import { join } from 'node:path';

import { initConfig } from '../config/config';
import { logger } from '../utils/logger';

/**
 * Fully uninstalls the Cronify daemon from the system,
 * including service hooks, files, and binary cleanup.
 */
export async function uninstallDaemon(values: any) {
  const config = initConfig();

  const os = process.platform;
  const execPath = process.execPath;

  const cronifyDir = join(homedir(), '.cronify');

  const vbsPath = join(cronifyDir, 'run_daemon.vbs');

  logger.info(`Removing Cronify system hooks for OS: ${os}`);

  /**
   * macOS launchd cleanup
   */
  if (os === 'darwin') {
    const plistPath = join(
      homedir(),
      'Library',
      'LaunchAgents',
      'com.cronify.daemon.plist',
    );

    if (existsSync(plistPath)) {
      spawnSync('launchctl', ['unload', plistPath]);

      unlinkSync(plistPath);
    }
  } else if (os === 'linux') {
    /**
     * Linux systemd cleanup
     */
    const servicePath = join(
      homedir(),
      '.config',
      'systemd',
      'user',
      'cronify.service',
    );

    if (existsSync(servicePath)) {
      spawnSync('systemctl', ['--user', 'disable', 'cronify.service']);

      unlinkSync(servicePath);

      spawnSync('systemctl', ['--user', 'daemon-reload']);
    }
  } else if (os === 'win32') {
    /**
     * Windows scheduled task cleanup
     */
    /**
     * Check for admin privileges
     */
    if (!isWindowsAdmin()) {
      logger.error(
        '❌ Administrator privileges are required to uninstall Cronify.',
      );

      logger.info(
        'Please reopen your terminal as Administrator and try again.',
      );

      process.exit(1);
    }

    logger.info('🛑 Stopping daemon before uninstall...');

    /**
     * Attempt graceful shutdown
     */
    try {
      await fetch(`http://127.0.0.1:${config.port}/api/shutdown`, {
        method: 'POST',
      });

      await new Promise((r) => setTimeout(r, 2000));

      logger.info('✅ Shutdown request sent');
    } catch {}

    /**
     * Remove scheduled task
     */
    spawnSync('schtasks', ['/delete', '/tn', 'CronifyDaemon', '/f'], {
      stdio: 'ignore',
    });

    /**
     * Kill daemon PID only
     */
    const pidFile = join(cronifyDir, 'daemon.pid');

    if (existsSync(pidFile)) {
      try {
        const pid = readFileSync(pidFile, 'utf-8').trim();

        if (pid) {
          spawnSync('taskkill', ['/F', '/PID', pid], {
            stdio: 'ignore',
          });
        }

        unlinkSync(pidFile);
      } catch {}
    }

    /**
     * Kill lingering launcher
     */
    spawnSync('taskkill', ['/F', '/IM', 'wscript.exe'], {
      stdio: 'ignore',
    });

    /**
     * Remove VBS launcher
     */
    if (existsSync(vbsPath)) {
      unlinkSync(vbsPath);
    }
  }

  /**
   * Decide whether user data should be deleted
   */
  const shouldDeleteUserData = !!values.full;

  logger.info(
    shouldDeleteUserData
      ? '🗑️ Deleting ALL user data...'
      : '📦 Preserving user data (~/.cronify)...',
  );

  console.info('🧨 Self-destructing binary file...');

  /**
   * Windows self-delete
   */
  if (os === 'win32') {
    const cleanupScript = `
@echo off

timeout /t 3 /nobreak > NUL

:retry
del "${execPath}" > NUL 2>&1

if exist "${execPath}" (
  timeout /t 1 /nobreak > NUL
  goto retry
)

${shouldDeleteUserData ? `rmdir /s /q "${cronifyDir}" > NUL 2>&1` : ''}

del "%~f0"
`;

    /**
     * Store cleanup script in TEMP
     * so it survives ~/.cronify deletion
     */
    const batPath = join(
      process.env.TEMP || process.cwd(),
      'cronify_cleanup.bat',
    );

    writeFileSync(batPath, cleanupScript);

    const child = spawn('cmd.exe', ['/c', batPath], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });

    child.unref();
  } else {
    /**
     * Unix cleanup
     */
    /**
     * Delete user data if requested
     */
    if (shouldDeleteUserData && existsSync(cronifyDir)) {
      rmSync(cronifyDir, {
        recursive: true,
        force: true,
      });
    }

    /**
     * Remove binary
     */
    if (existsSync(execPath)) {
      unlinkSync(execPath);
    }
  }

  console.info(
    '✅ Cronify has been completely removed from your system. Goodbye!',
  );

  process.exit(0);
}

/**
 * Checks admin privilege
 */
export function isWindowsAdmin(): boolean {
  const result = spawnSync('net', ['session'], {
    stdio: 'ignore',
    shell: true,
  });

  return result.status === 0;
}
