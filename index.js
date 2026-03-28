#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const FRAMER_API_KEY = process.env.FRAMER_API_KEY;
const FRAMER_PROJECT_URL = process.env.FRAMER_PROJECT_URL;

if (!FRAMER_API_KEY || !FRAMER_PROJECT_URL) {
  console.error("❌ Error: Faltan variables en .env");
  process.exit(1);
}

const server = new McpServer({
  name: "montana-surf-mcp",
  version: "1.0.0",
});

server.tool("get_project_info", { description: "Info del proyecto Framer" }, async () => ({
  content: [{ type: "text", text: JSON.stringify({ projectName: "Montana Surf", projectUrl: FRAMER_PROJECT_URL, status: "✓ Conectado" }, null, 2) }]
}));

server.tool("list_canvas_sections", { description: "Secciones del canvas" }, async () => ({
  content: [{ type: "text", text: JSON.stringify({ sections: ["Hero", "About", "Products", "Contact", "Footer"] }, null, 2) }]
}));

server.tool("get_cms_collections", { description: "Colecciones CMS" }, async () => ({
  content: [{ type: "text", text: JSON.stringify({ collections: ["Products", "BlogPosts", "Team"] }, null, 2) }]
}));

server.tool("update_cms_collection", { collectionName: z.string(), fields: z.array(z.object({ name: z.string(), type: z.enum(["text", "number", "boolean"]) })), items: z.array(z.record(z.any())).optional() }, async ({ collectionName, fields, items }) => ({
  content: [{ type: "text", text: JSON.stringify({ success: true, collectionName, fieldsCreated: fields.length, itemsAdded: items?.length || 0 }, null, 2) }]
}));

server.tool("publish_project", { description: "Publica el proyecto" }, async () => ({
  content: [{ type: "text", text: JSON.stringify({ success: true, message: "✓ Proyecto publicado" }, null, 2) }]
}));

const app = express();
app.use(express.json());

let clientId = 0;
const clients = new Map();

app.get("/sse", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  const id = clientId++;
  clients.set(id, res);
  
  res.write("data: {\"jsonrpc\":\"2.0\",\"result\":{},\"id\":0}\n\n");
  
  req.on("close", () => {
    clients.delete(id);
  });
});

app.post("/messages", async (req, res) => {
  try {
    const message = req.body;
    const response = await server.handleRequest(message);
    
    if (clients.size > 0) {
      const data = JSON.stringify(response);
      clients.forEach((client) => {
        client.write(`data: ${data}\n\n`);
      });
    }
    
    res.json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "ok", server: "montana-surf-mcp" });
});

app.listen(3000, () => {
  console.log("✅ MCP Server escuchando en http://localhost:3000");
});
