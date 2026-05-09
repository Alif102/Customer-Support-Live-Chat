const { createServer } = require("http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const { initSocket } = require(
    "./app/server/socket"
  );

  initSocket(server);

  server.listen(3000, () => {
    console.log("🚀 Server running");
  });
});