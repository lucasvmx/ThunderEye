import express from "express";
import cors from "cors";
import { logError, logInfo } from "./Log";

function startHttp() {
  const { PORT } = process.env;
  const app = express();

  if (PORT === undefined) {
    logError("port is not defined");
    process.exit(1);
  }

  // Adds basic route
  const routes = express.Router();
  routes.get("/health", async (req, res) => {
    const text = `${process.pid}`;
    return res.status(200).write(text);
  });

  app.use(express.json());
  app.use(cors());
  app.use(routes);
  app.listen(PORT);
  logInfo("started HTTP server");
}

export { startHttp };
