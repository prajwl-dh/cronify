import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { logger } from "../utils/logger";

export type CronifyConfig = {
  port: number;
};

const DEFAULT_CONFIG: CronifyConfig = {
  port: 2207,
};

/**
 * Initializes the Cronify configuration.
 *
 * Creates the ~/.cronify directory and config.json
 * if they do not exist, then returns the final
 * merged configuration object.
 */
export function initConfig(): CronifyConfig {
  const dir = join(homedir(), ".cronify");
  const configPath = join(dir, "config.json");

  // Create the config directory on first run
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Generate config.json using default values
  if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");

    return DEFAULT_CONFIG;
  }

  try {
    // Read and parse the existing config file
    const fileContent = readFileSync(configPath, "utf-8");
    const userConfig = JSON.parse(fileContent);

    // Merge user config with fallback defaults
    const finalConfig = {
      ...DEFAULT_CONFIG,
      ...userConfig,
    };

    // Auto-heal config.json when new keys are added
    if (Object.keys(DEFAULT_CONFIG).length !== Object.keys(userConfig).length) {
      writeFileSync(configPath, JSON.stringify(finalConfig, null, 2), "utf-8");
    }

    return finalConfig;
  } catch (error) {
    logger.error("❌ Failed to parse config.json. Using fallback defaults.");
    return DEFAULT_CONFIG;
  }
}
