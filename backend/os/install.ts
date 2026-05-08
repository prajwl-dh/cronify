import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { logger } from '../utils/logger';

export function installDaemon() {
  const os = process.platform;
  const execPath = process.execPath;
  const home = homedir();

  logger.info(`Installing Cronify daemon for OS: ${os}`);

  try {
    if (os === 'darwin') {
      const plistDir = join(home, 'Library', 'LaunchAgents');
      if (!existsSync(plistDir)) mkdirSync(plistDir, { recursive: true });
      const plistPath = join(plistDir, 'com.cronify.daemon.plist');

      const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
        <plist version="1.0">
        <dict>
            <key>Label</key>
            <string>com.cronify.daemon</string>
            <key>ProgramArguments</key>
            <array>
                <string>${execPath}</string>
                <string>daemon</string>
                <string>--internal</string>
            </array>
            <key>RunAtLoad</key>
            <true/>
            <key>KeepAlive</key>
            <true/>
        </dict>
        </plist>`;

      writeFileSync(plistPath, plistContent, 'utf-8');
      spawnSync('launchctl', ['load', plistPath], { stdio: 'inherit' });
      logger.info('✅ macOS launchd agent installed and loaded.');
    } else if (os === 'linux') {
      const systemdDir = join(home, '.config', 'systemd', 'user');
      if (!existsSync(systemdDir)) mkdirSync(systemdDir, { recursive: true });
      const servicePath = join(systemdDir, 'cronify.service');

      const serviceContent = `[Unit]
        Description=Cronify Background Daemon
        After=network.target

        [Service]
        ExecStart=${execPath} daemon --internal
        Restart=always
        RestartSec=10

        [Install]
        WantedBy=default.target`;

      writeFileSync(servicePath, serviceContent, 'utf-8');
      spawnSync('systemctl', ['--user', 'daemon-reload'], { stdio: 'inherit' });
      spawnSync('systemctl', ['--user', 'enable', '--now', 'cronify.service'], {
        stdio: 'inherit',
      });
      logger.info('✅ Linux systemd service installed and started.');
    } else if (os === 'win32') {
      const command = `schtasks /create /tn "CronifyDaemon" /tr "\\"${execPath}\\" daemon --internal" /sc onlogon /f`;
      spawnSync('cmd.exe', ['/c', command], { stdio: 'inherit' });
      logger.info('✅ Windows Scheduled Task installed.');
      spawnSync('schtasks', ['/run', '/tn', 'CronifyDaemon'], {
        stdio: 'ignore',
      });
    } else {
      logger.error(`❌ Unsupported OS: ${os}`);
      process.exit(1);
    }

    logger.info(
      '🎉 Cronify installation complete! The daemon is now running in the background.',
    );
  } catch (error) {
    logger.error('❌ Installation failed:', error);
  }
}
