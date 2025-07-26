import { build } from "esbuild";

const entryFile = "./src/index.ts";
const shared = {
  bundle: true,
  entryPoints: [entryFile],
  logLevel: "info",
  minify: true,
  sourcemap: true,
};

build({
  ...shared,
  format: "esm",
  outfile: "./dist/index.js",
});
