import { spawn, spawnSync } from 'node:child_process';
import { existsSync, rmSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { initConfig } from '../config/config';
import { logger } from '../utils/logger';

export async function uninstallDaemon() {
  const config = initConfig();
  const os = process.platform;
  const execPath = process.execPath;

  const cronifyDir = join(homedir(), '.cronify');
  const vbsPath = join(cronifyDir, 'run_daemon.vbs');

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
    logger.info('🛑 Stopping daemon before uninstall...');

    try {
      // graceful shutdown FIRST
      await fetch(`http://127.0.0.1:${config.port}/api/shutdown`, {
        method: 'POST',
      });

      await new Promise((r) => setTimeout(r, 2000));
    } catch {}

    spawnSync('schtasks', ['/delete', '/tn', 'CronifyDaemon', '/f'], {
      stdio: 'ignore',
    });

    spawnSync('taskkill', ['/F', '/IM', 'bun.exe'], { stdio: 'ignore' });
    spawnSync('taskkill', ['/F', '/IM', 'node.exe'], { stdio: 'ignore' });
    spawnSync('taskkill', ['/F', '/IM', 'wscript.exe'], { stdio: 'ignore' });

    if (existsSync(vbsPath)) {
      unlinkSync(vbsPath);
    }
  }

  logger.info('🗑️ Deleting database, logs, and configurations...');
  if (existsSync(cronifyDir)) {
    rmSync(cronifyDir, { recursive: true, force: true });
  }

  console.info('🧨 Self-destructing binary file...');

  if (os === 'win32') {
    // delay delete for running exe
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
