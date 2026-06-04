import pkg from "../../../package.json";

export function versionCommand() {
  console.info(pkg.version);
}
