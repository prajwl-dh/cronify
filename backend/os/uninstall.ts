import { spawn, spawnSync } from 'node:child_process';
import { existsSync, rmSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { initConfig } from '../config/config';
import { logger } from '../utils/logger';

/**
 * Fully uninstalls the Cronify daemon from the system,
 * including service hooks, files, and binary cleanup.
 */
export async function uninstallDaemon() {
  const config = initConfig();
  const os = process.platform;
  const execPath = process.execPath;

  const cronifyDir = join(homedir(), '.cronify');
  const vbsPath = join(cronifyDir, 'run_daemon.vbs');

  logger.info(`Removing Cronify system hooks for OS: ${os}`);

  // macOS launchd cleanup
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
  }

  // Linux systemd cleanup
  else if (os === 'linux') {
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
  }

  // Windows scheduled task cleanup
  else if (os === 'win32') {
    logger.info('🛑 Stopping daemon before uninstall...');

    try {
      // Attempt graceful shutdown before removing anything
      await fetch(`http://127.0.0.1:${config.port}/api/shutdown`, {
        method: 'POST',
      });

      await new Promise((r) => setTimeout(r, 2000));
    } catch {}

    // Remove scheduled task
    spawnSync('schtasks', ['/delete', '/tn', 'CronifyDaemon', '/f'], {
      stdio: 'ignore',
    });

    // Kill any lingering processes
    spawnSync('taskkill', ['/F', '/IM', 'bun.exe'], { stdio: 'ignore' });
    spawnSync('taskkill', ['/F', '/IM', 'node.exe'], { stdio: 'ignore' });
    spawnSync('taskkill', ['/F', '/IM', 'wscript.exe'], { stdio: 'ignore' });

    // Remove VBS launcher
    if (existsSync(vbsPath)) {
      unlinkSync(vbsPath);
    }
  }

  // Remove Cronify data directory
  logger.info('🗑️ Deleting database, logs, and configurations...');

  if (existsSync(cronifyDir)) {
    rmSync(cronifyDir, { recursive: true, force: true });
  }

  console.info('🧨 Self-destructing binary file...');

  // Remove installed binary depending on OS
  if (os === 'win32') {
    // Delay deletion because Windows locks executing binaries
    const command = `timeout /t 2 /nobreak > NUL & del "${execPath}"`;

    const child = spawn('cmd.exe', ['/c', command], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });

    child.unref();
  } else {
    // Unix systems can remove binary immediately
    if (existsSync(execPath)) {
      unlinkSync(execPath);
    }
  }

  console.info(
    '✅ Cronify has been completely removed from your system. Goodbye!',
  );

  process.exit(0);
}
