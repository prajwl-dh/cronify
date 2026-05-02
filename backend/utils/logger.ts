import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import pino from 'pino';

const logDir = path.join(homedir(), '.cronify', 'logs');

if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

function getLogFile() {
  const date = new Date().toISOString().split('T')[0];
  return path.join(logDir, `${date}.log`);
}

const transport = pino.destination({
  dest: getLogFile(),
  sync: false,
});

export const logger = pino(
  {
    level: 'info',
    base: null,
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport,
);
