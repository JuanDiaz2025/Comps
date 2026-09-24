// Local server: node server.js  →  http://localhost:3000
const http = require("http");
const fs = require("fs");
const path = require("path");

try {
  for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch (e) {}

const comps = require("./api/comps.js");
const PUBLIC = path.join(__dirname, "public");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/comps") return comps(req, res);
  const file = path.normalize(path.join(PUBLIC, url.pathname === "/" ? "index.html" : url.pathname));
  if (!file.startsWith(PUBLIC)) { res.statusCode = 403; return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.statusCode = 404; return res.end("Not found"); }
    res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
    res.end(buf);
  });
}).listen(process.env.PORT || 3000, () => {
  console.log(`Twin Comp AI running at http://localhost:${process.env.PORT || 3000}` + (process.env.MOCK === "1" ? " (mock data)" : ""));
});
