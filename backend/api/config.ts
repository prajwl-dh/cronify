import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { logger } from '../utils/logger';

export type CronifyConfig = {
  port: number;
};

const DEFAULT_CONFIG: CronifyConfig = {
  port: 2207,
};

export function initConfig(): CronifyConfig {
  console.log('⚙️  Loading configs ...');
  logger.info('⚙️  Loading configs ...');
  const dir = join(homedir(), '.cronify');
  const configPath = join(dir, 'config.json');

  // If .cronify directory does not exist, create it
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // If config.json file does not exist, create it from DEFAULT_CONFIG
  if (!existsSync(configPath)) {
    const message = '⚙️ Creating default config.json...';
    console.log(message);
    logger.info(message);
    writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
    return DEFAULT_CONFIG;
  }

  try {
    // Read contents from config.json
    const fileContent = readFileSync(configPath, 'utf-8');
    const userConfig = JSON.parse(fileContent);

    // Merge DEFAULT_CONFIG with config.json
    const finalConfig = { ...DEFAULT_CONFIG, ...userConfig };

    // Auto-heal the config file if missing keys were injected
    if (Object.keys(DEFAULT_CONFIG).length !== Object.keys(userConfig).length) {
      writeFileSync(configPath, JSON.stringify(finalConfig, null, 2), 'utf-8');
    }

    return finalConfig;
  } catch (error) {
    const message = '❌ Failed to parse config.json. Using fallback defaults.';
    console.error(message, error);
    logger.info(message + error);
    return DEFAULT_CONFIG;
  }
}
