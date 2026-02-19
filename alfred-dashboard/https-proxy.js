const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const HTTPS_PORT = 3443;
const HTTP_TARGET = "http://127.0.0.1:3000";

const options = {
  key: fs.readFileSync(path.join(__dirname, "certs", "key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "certs", "cert.pem")),
};

const server = https.createServer(options, (req, res) => {
  const proxyReq = http.request(
    `${HTTP_TARGET}${req.url}`,
    {
      method: req.method,
      headers: req.headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on("error", (err) => {
    res.writeHead(502);
    res.end("Proxy error: " + err.message);
  });
  req.pipe(proxyReq);
});

server.listen(HTTPS_PORT, "127.0.0.1", () => {
  console.log(`HTTPS proxy listening on https://127.0.0.1:${HTTPS_PORT} -> ${HTTP_TARGET}`);
});
