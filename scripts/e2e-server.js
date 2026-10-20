// API server for end-to-end tests. Uses an in-memory MongoDB and never connects
// to Atlas or any real database. Also exposes test-only control endpoints on
// E2E_CONTROL_PORT (POST /reset empties the database, GET /health identifies it).
const http = require("node:http");
const { MongoMemoryServer } = require("mongodb-memory-server");

async function main() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri("tailor-e2e");
  if (!uri.startsWith("mongodb://127.0.0.1")) {
    throw new Error(`Refusing to start E2E server against ${uri}`);
  }
  // Set before src/config/db.js loads dotenv; dotenv never overrides existing vars.
  process.env.MONGODB_URI = uri;

  const mongoose = require("mongoose");
  const connectDB = require("../src/config/db");
  await connectDB();
  if (mongoose.connection.host !== "127.0.0.1") {
    throw new Error(`E2E server connected to ${mongoose.connection.host}`);
  }

  const { createApp } = require("../src/app");
  const app = createApp({ webDist: process.env.WEB_DIST });
  const port = Number(process.env.PORT || 5000);
  const controlPort = Number(process.env.E2E_CONTROL_PORT || 5055);

  app.listen(port, () =>
    console.log(`E2E API on port ${port} (in-memory MongoDB)`),
  );

  http
    .createServer(async (req, res) => {
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ e2e: true }));
      }
      if (req.method === "POST" && req.url === "/reset") {
        const { collections } = mongoose.connection;
        await Promise.all(
          Object.values(collections).map((c) => c.deleteMany({})),
        );
        res.writeHead(204);
        return res.end();
      }
      res.writeHead(404);
      res.end();
    })
    .listen(controlPort, "127.0.0.1", () =>
      console.log(`E2E control on 127.0.0.1:${controlPort}`),
    );

  const stop = async () => {
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
