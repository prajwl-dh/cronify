import { spawn, spawnSync } from 'node:child_process';
import { existsSync, rmSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { logger } from '../utils/logger';

export async function uninstallDaemon() {
  const os = process.platform;
  const execPath = process.execPath;
  const cronifyDir = join(homedir(), '.cronify');

  logger.info(`Removing Cronify system hooks for OS: ${os}`);

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
    spawnSync('schtasks', ['/delete', '/tn', 'CronifyDaemon', '/f'], {
      stdio: 'ignore',
    });
  }

  logger.info('🗑️ Deleting database, logs, and configurations...');
  if (existsSync(cronifyDir)) {
    rmSync(cronifyDir, { recursive: true, force: true });
  }

  console.info('🧨 Self-destructing binary file...');

  if (os === 'win32') {
    // Detached process trick to delete the running .exe file on Windows
    const command = `timeout /t 2 /nobreak > NUL & del "${execPath}"`;
    const child = spawn('cmd.exe', ['/c', command], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();
  } else {
    // Mac and Linux allow unlinking immediately
    if (existsSync(execPath)) {
      unlinkSync(execPath);
    }
  }

  console.info(
    '✅ Cronify has been completely removed from your system. Goodbye!',
  );
  process.exit(0);
}
