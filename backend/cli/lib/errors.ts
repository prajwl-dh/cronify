/**
 * Ensures a required condition/flag is truthy.
 * If the condition fails, logs an error and exits the process.
 *
 * Used for enforcing required CLI/runtime preconditions.
 */
export function requireFlag(flag: any, message: string): asserts flag {
  if (!flag) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

/**
 * Validates that a value can be safely converted to a number.
 * Exits the process if the value is not a valid number.
 *
 * Returns the parsed numeric value if valid.
 */
export function requireNumber(value: any, message: string): number {
  const num = Number(value);

  if (isNaN(num)) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }

  return num;
}
