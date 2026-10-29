import { Database } from "bun:sqlite";
import {
  initConfig,
  saveConfig,
  type CronifyConfig,
} from "../../../config/config";
import { purgeOldLogs } from "../../../db/schema";
import { logger } from "../../../utils/logger";
import { error, json, readJson } from "../../lib/http";

/**
 * Handles GET /api/config
 */
export async function getConfig() {
  const config = initConfig();

  return json({
    config,
    restartRequired: false,
  });
}

/**
 * Handles PATCH /api/config
 * Updates daemon preferences. Port changes require a restart.
 */
export async function updateConfig(req: Request, db: Database) {
  try {
    const body = await readJson<Partial<CronifyConfig>>(req);
    const previous = initConfig();

    const patch: Partial<CronifyConfig> = {};

    if (body.port !== undefined) patch.port = Number(body.port);
    if (body.defaultTimeoutMs !== undefined) {
      patch.defaultTimeoutMs = Number(body.defaultTimeoutMs);
    }
    if (body.logRetentionDays !== undefined) {
      patch.logRetentionDays = Number(body.logRetentionDays);
    }

    if (Object.keys(patch).length === 0) {
      return error("No settings provided");
    }

    const config = saveConfig(patch);
    let purged = 0;

    if (
      config.logRetentionDays !== previous.logRetentionDays &&
      config.logRetentionDays > 0
    ) {
      purged = purgeOldLogs(db, config.logRetentionDays);
    }

    logger.info(
      `Configuration updated: timeout ${config.defaultTimeoutMs} ms, retention ${config.logRetentionDays} days.`,
    );

    return json({
      config,
      purged,
      restartRequired: config.port !== previous.port,
    });
  } catch (err: any) {
    logger.error(`PATCH /api/config error: ${err}`);
    return error(err?.message || "Failed to update configuration");
  }
}
