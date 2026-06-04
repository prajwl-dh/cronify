import { stripANSI } from "bun";
import { appendFileSync, existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import path from "path";

const logDir = path.join(homedir(), ".cronify", "logs");

// Create the logs directory on first run
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

/**
 * Returns the current daily log file path.
 * Example: ~/.cronify/logs/2026-05-08.log
 */
function getLogFile() {
  const date = new Date().toISOString().split("T")[0];
  return path.join(logDir, `${date}.log`);
}

type LogLevel = "debug" | "info" | "warn" | "error";

const levelPriority: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const CURRENT_LEVEL: LogLevel = "info";

// ANSI colors used for terminal output
const colors: Record<LogLevel, string> = {
  debug: "\x1b[90m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};

const reset = "\x1b[0m";

/**
 * Formats log messages with timestamp and level.
 */
function formatMessage(level: LogLevel, message: string) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

/**
 * Appends log messages into the daily log file.
 */
function writeToFile(message: string) {
  try {
    appendFileSync(getLogFile(), message + "\n");
  } catch (err) {
    console.error("Failed to write log file:", err);
  }
}

/**
 * Handles console logging and file persistence.
 */
function log(level: LogLevel, message: string, ...args: any[]) {
  if (levelPriority[level] < levelPriority[CURRENT_LEVEL]) return;

  const fullMessage =
    args.length > 0
      ? `${message} ${args.map((a) => JSON.stringify(a)).join(" ")}`
      : message;

  const formatted = formatMessage(level, fullMessage);

  // Colored terminal output
  console.log(`${colors[level]}${formatted}${reset}`);

  // Plain text file output
  writeToFile(stripANSI(formatted));
}

export const logger = {
  debug: (msg: string, ...args: any[]) => log("debug", msg, ...args),
  info: (msg: string, ...args: any[]) => log("info", msg, ...args),
  warn: (msg: string, ...args: any[]) => log("warn", msg, ...args),
  error: (msg: string, ...args: any[]) => log("error", msg, ...args),
};
