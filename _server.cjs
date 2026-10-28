const http = require("http");
const fs = require("fs");
const path = require("path");
const root = "C:\\Users\\Victor Gomes\\Documents\\deepseek-harness\\default-workspace\\clouse-tools";
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpeg": "image/jpeg", ".ico": "image/x-icon" };
http.createServer(function (req, res) {
  var p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  var file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end("forbidden"); }
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404); return res.end("not found: " + p); }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  });
}).listen(8765, function () { console.log("Clouse Tools dev server on http://localhost:8765"); });
