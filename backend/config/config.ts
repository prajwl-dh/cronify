import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { logger } from "../utils/logger";

export type CronifyConfig = {
  /** Port the daemon listens on. Changing it requires a restart. */
  port: number;
  /** Default command timeout in milliseconds. 0 disables the timeout. */
  defaultTimeoutMs: number;
  /** Delete execution logs older than this many days. 0 keeps them forever. */
  logRetentionDays: number;
};

const DEFAULT_CONFIG: CronifyConfig = {
  port: 2207,
  defaultTimeoutMs: 0,
  logRetentionDays: 0,
};

export function getConfigDir() {
  return join(homedir(), ".cronify");
}

export function getConfigPath() {
  return join(getConfigDir(), "config.json");
}

/**
 * Initializes the Cronify configuration.
 *
 * Creates the ~/.cronify directory and config.json if they do not
 * exist, then returns the final merged configuration object.
 */
export function initConfig(): CronifyConfig {
  const dir = getConfigDir();
  const configPath = getConfigPath();

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  if (!existsSync(configPath)) {
    writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8");
    return DEFAULT_CONFIG;
  }

  try {
    const fileContent = readFileSync(configPath, "utf-8");
    const userConfig = JSON.parse(fileContent) as Partial<CronifyConfig>;

    const finalConfig: CronifyConfig = {
      ...DEFAULT_CONFIG,
      ...userConfig,
    };

    // Auto-heal config.json when new keys are added.
    const needsHealing = (
      Object.keys(DEFAULT_CONFIG) as (keyof CronifyConfig)[]
    ).some((key) => userConfig[key] === undefined);

    if (needsHealing) {
      writeFileSync(configPath, JSON.stringify(finalConfig, null, 2), "utf-8");
    }

    return finalConfig;
  } catch (error) {
    logger.error("❌ Failed to parse config.json. Using fallback defaults.");
    return DEFAULT_CONFIG;
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Validates and persists a partial configuration update.
 */
export function saveConfig(patch: Partial<CronifyConfig>): CronifyConfig {
  const current = initConfig();
  const next: CronifyConfig = { ...current };

  if (patch.port !== undefined) {
    if (!isFiniteNumber(patch.port) || patch.port < 1 || patch.port > 65535) {
      throw new Error("Port must be between 1 and 65535");
    }
    next.port = Math.floor(patch.port);
  }

  if (patch.defaultTimeoutMs !== undefined) {
    if (!isFiniteNumber(patch.defaultTimeoutMs) || patch.defaultTimeoutMs < 0) {
      throw new Error("Default timeout must be zero or a positive number");
    }
    next.defaultTimeoutMs = Math.floor(patch.defaultTimeoutMs);
  }

  if (patch.logRetentionDays !== undefined) {
    if (!isFiniteNumber(patch.logRetentionDays) || patch.logRetentionDays < 0) {
      throw new Error(
        "Log retention must be zero or a positive number of days",
      );
    }
    next.logRetentionDays = Math.floor(patch.logRetentionDays);
  }

  writeFileSync(getConfigPath(), JSON.stringify(next, null, 2), "utf-8");

  return next;
}
