// Build script. Bundles src/main.ts via esbuild into dist/app.js,
// copies index.html, style.css, and data/stems_bundle.json into dist/.
// Run with: node tools/build.mjs

import { execSync } from "node:child_process";
import { cpSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import esbuild from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const distDir = join(repoRoot, "dist");

function clean() {
	if (existsSync(distDir)) {
		rmSync(distDir, { recursive: true, force: true });
	}
	mkdirSync(distDir, { recursive: true });
}

function regenerateBundle() {
	// Keep stems_bundle.json fresh on every build.
	execSync("source source_me.sh && python3 tools/yaml_to_json.py", {
		cwd: repoRoot,
		stdio: "inherit",
		shell: "/bin/bash",
	});
}

async function bundleJs() {
	await esbuild.build({
		entryPoints: [join(repoRoot, "src/main.ts")],
		bundle: true,
		minify: true,
		format: "esm",
		target: ["es2022"],
		outfile: join(distDir, "app.js"),
		sourcemap: "linked",
		logLevel: "info",
	});
}

function copyStaticAssets() {
	cpSync(join(repoRoot, "index.html"), join(distDir, "index.html"));
	cpSync(join(repoRoot, "src/style.css"), join(distDir, "style.css"));
	cpSync(
		join(repoRoot, "data/stems_bundle.json"),
		join(distDir, "stems_bundle.json")
	);
}

async function main() {
	clean();
	regenerateBundle();
	await bundleJs();
	copyStaticAssets();
	console.log(`Built ${distDir}`);
}

main();
