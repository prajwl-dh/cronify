import { describe, expect, it } from "bun:test";
import { routeOutput, sanitizeOutput } from "./output";

const BEL = "\x07";
const ESC = "\x1b";

describe("sanitizeOutput", () => {
  it("removes iTerm2 shell integration sequences from the start of output", () => {
    const raw =
      `${ESC}]1337;RemoteHost=prajwal@mac.lan${BEL}` +
      `${ESC}]1337;CurrentDir=/${BEL}` +
      `${ESC}]1337;ShellIntegrationVersion=14;shell=zsh${BEL}` +
      "==> Upgrading fontconfig\n";

    expect(sanitizeOutput(raw)).toBe("==> Upgrading fontconfig\n");
  });

  it("removes OSC sequences terminated by ST", () => {
    const raw = `${ESC}]1337;SetMark${ESC}\\hello`;
    expect(sanitizeOutput(raw)).toBe("hello");
  });

  it("removes ANSI colour and cursor codes", () => {
    const raw = `${ESC}[31mred${ESC}[0m ${ESC}[2K${ESC}[1Atext`;
    expect(sanitizeOutput(raw)).toBe("red text");
  });

  it("leaves plain output untouched", () => {
    expect(sanitizeOutput("hello\nworld")).toBe("hello\nworld");
  });
});

describe("routeOutput", () => {
  it("puts all output in stdout on success, including stderr content", () => {
    const result = routeOutput("upgrade complete", "downloading bottle", 0);
    expect(result).toEqual({
      stdout: "upgrade complete\ndownloading bottle",
      stderr: "",
    });
  });

  it("puts all output in stderr on failure, including stdout content", () => {
    const result = routeOutput("partial output", "command not found", 127);
    expect(result).toEqual({
      stdout: "",
      stderr: "partial output\ncommand not found",
    });
  });

  it("omits empty streams", () => {
    expect(routeOutput("", "", 0)).toEqual({ stdout: "", stderr: "" });
    expect(routeOutput("only stdout", "", 0)).toEqual({
      stdout: "only stdout",
      stderr: "",
    });
    expect(routeOutput("", "only stderr", 1)).toEqual({
      stdout: "",
      stderr: "only stderr",
    });
  });
});
