import { $ } from "bun";
import { rmSync, mkdirSync } from "node:fs";

try {
  console.log("🧹 Cleaning old build output...");
  rmSync("dist", { recursive: true, force: true });
  rmSync("out", { recursive: true, force: true });
  rmSync("ui", { recursive: true, force: true });
  mkdirSync("ui", { recursive: true });

  console.log("📦 Building frontend (TypeScript & Vite)...");
  await $`cd frontend && bun ./node_modules/typescript/bin/tsc -b && bun ./node_modules/vite/bin/vite.js build`;

  console.log("⚙️ Compiling Cronify binary...");
  await $`bun build ./index.ts --compile --outfile ./dist/cronify`;

  console.log("✅ Cronify dev-build completed successfully!");
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}
