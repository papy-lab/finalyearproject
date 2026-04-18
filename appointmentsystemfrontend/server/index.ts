import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

const BACKEND_API_URL = (process.env.VITE_API_URL || "http://localhost:8080").replace(/\/+$/, "");

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  app.use("/api", async (req, res, next) => {
    try {
      const targetUrl = new URL(req.originalUrl, BACKEND_API_URL);
      const headers = new Headers();

      for (const [key, value] of Object.entries(req.headers)) {
        if (!value) continue;
        const lowerKey = key.toLowerCase();
        if (lowerKey === "host" || lowerKey === "content-length") continue;

        if (Array.isArray(value)) {
          value.forEach((entry) => headers.append(key, entry));
        } else {
          headers.set(key, value);
        }
      }

      const init: RequestInit = {
        method: req.method,
        headers,
        redirect: "manual",
      };

      if (req.method !== "GET" && req.method !== "HEAD") {
        init.body = JSON.stringify(req.body);
      }

      const upstream = await fetch(targetUrl, init);
      const responseBody = Buffer.from(await upstream.arrayBuffer());

      res.status(upstream.status);

      upstream.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey === "content-encoding" ||
          lowerKey === "content-length" ||
          lowerKey === "transfer-encoding"
        ) {
          return;
        }
        res.setHeader(key, value);
      });

      res.send(responseBody);
    } catch (error) {
      next(error);
    }
  });

  return app;
}
