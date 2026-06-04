import { CronExpressionParser } from "cron-parser";

export default function cronValidator(str: string) {
  try {
    const parts = str.trim().split(/\s+/);

    if (parts.length < 5 || parts.length > 6) {
      throw new Error();
    }

    CronExpressionParser.parse(str);
    return "";
  } catch {
    return "error";
  }
}
