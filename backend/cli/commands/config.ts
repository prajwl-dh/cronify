import { apiFetch } from "../lib/api";
import { getApiUrl } from "../lib/config";
import { color } from "../lib/render";

type Config = {
  port: number;
  defaultTimeoutMs: number;
  logRetentionDays: number;
};

type ConfigResponse = {
  config: Config;
  restartRequired?: boolean;
  purged?: number;
};

type ConfigValues = {
  port?: string;
  timeout?: string;
  retention?: string;
  json?: boolean;
};

/**
 * CLI command: config
 * Shows or updates daemon preferences. Port changes need a restart.
 */
export async function configCommand(values: ConfigValues = {}) {
  const patch: Record<string, number> = {};

  if (values.port !== undefined) {
    const port = Number(values.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      console.error("❌ --port must be between 1 and 65535");
      process.exit(1);
    }
    patch.port = port;
  }

  if (values.timeout !== undefined) {
    const seconds = Number(values.timeout);
    if (!Number.isFinite(seconds) || seconds < 0) {
      console.error(
        "❌ --timeout must be zero or a positive number of seconds",
      );
      process.exit(1);
    }
    patch.defaultTimeoutMs = Math.round(seconds * 1000);
  }

  if (values.retention !== undefined) {
    const days = Number(values.retention);
    if (!Number.isInteger(days) || days < 0) {
      console.error("❌ --retention must be zero or a positive number of days");
      process.exit(1);
    }
    patch.logRetentionDays = days;
  }

  const hasPatch = Object.keys(patch).length > 0;
  const data = (await apiFetch(`${getApiUrl()}/api/config`, {
    method: hasPatch ? "PATCH" : "GET",
    ...(hasPatch ? { body: JSON.stringify(patch) } : {}),
  })) as ConfigResponse;

  if (values.json) {
    console.info(JSON.stringify(data, null, 2));
    return;
  }

  console.info(color.bold("Cronify configuration"));
  console.info(`  port                 ${data.config.port}`);
  console.info(
    `  default timeout      ${data.config.defaultTimeoutMs ? `${Math.round(data.config.defaultTimeoutMs / 1000)}s` : "off"}`,
  );
  console.info(
    `  log retention        ${data.config.logRetentionDays ? `${data.config.logRetentionDays} days` : "forever"}`,
  );

  if (hasPatch) {
    console.info("");
    console.info(color.green("Settings saved."));
    if (data.purged) console.info(`  Removed ${data.purged} old log(s).`);
    if (data.restartRequired) {
      console.info(
        color.yellow(
          "  Restart the daemon to apply the new port: cronify change --port <port>",
        ),
      );
    }
  }
}
