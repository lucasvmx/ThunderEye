import express from "express";
import { logError, logInfo } from "./log";

export function startHttp() {
  const { PORT } = process.env;
  const app = express();

  if (PORT === undefined) {
    logError("port is not defined");
    process.exit(1);
  }

  // Adds basic route
  const routes = express.Router();
  routes.get("/health", async (req, res) => {
    return res.status(200).json({ alive: true, pid: `${process.pid}` });
  });

  app.listen(PORT);
  logInfo("started HTTP server");
}
