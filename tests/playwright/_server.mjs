// Server helper for Playwright smoke tests.
// Starts a local HTTP server on a given port, serves dist/ directory.
// Uses Node.js built-in http and fs modules only.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");
const distDir = path.join(repoRoot, "dist");

//============================================
// Serve static files from dist/
//============================================

function start_server(port) {
	const server = http.createServer((req, res) => {
		// Normalize path: remove leading slash, prevent traversal
		let filePath = req.url === "/" ? "index.html" : req.url.replace(/^\//, "");

		// Security: block path traversal
		const normalizedPath = path.normalize(filePath);
		if (normalizedPath.startsWith("..") || path.isAbsolute(normalizedPath)) {
			res.writeHead(403, { "Content-Type": "text/plain" });
			res.end("Forbidden");
			return;
		}

		const fullPath = path.join(distDir, normalizedPath);

		// Serve the file
		fs.readFile(fullPath, (err, data) => {
			if (err) {
				res.writeHead(404, { "Content-Type": "text/plain" });
				res.end("Not Found");
				return;
			}

			// Simple content-type detection
			let contentType = "text/plain";
			if (fullPath.endsWith(".html")) contentType = "text/html";
			else if (fullPath.endsWith(".css")) contentType = "text/css";
			else if (fullPath.endsWith(".js")) contentType = "application/javascript";
			else if (fullPath.endsWith(".json")) contentType = "application/json";

			res.writeHead(200, { "Content-Type": contentType });
			res.end(data);
		});
	});

	return new Promise((resolve, reject) => {
		server.listen(port, () => {
			resolve(server);
		});
		server.on("error", reject);
	});
}

//============================================
// Stop server
//============================================

function stop_server(server) {
	return new Promise((resolve, reject) => {
		server.close((err) => {
			if (err) reject(err);
			else resolve();
		});
	});
}

export { start_server, stop_server };
