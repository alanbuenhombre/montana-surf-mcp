#!/usr/bin/env node
import express from 'express';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(express.json());

const tools = [
  { name: "get_project_info", description: "Info del proyecto Framer" },
  { name: "list_canvas_sections", description: "Secciones del canvas" },
  { name: "get_cms_collections", description: "Colecciones CMS" },
  { name: "update_cms_collection", description: "Actualiza CMS" },
  { name: "publish_project", description: "Publica proyecto" }
];

app.post('/', (req, res) => {
  const { jsonrpc, method, id } = req.body;
  
  if (method === 'initialize') {
    return res.json({
      jsonrpc, id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "montana-surf-mcp", version: "1.0.0" }
      }
    });
  }
  
  if (method === 'tools/list') {
    return res.json({ jsonrpc, id, result: { tools } });
  }
  
  if (method === 'tools/call') {
    return res.json({
      jsonrpc, id,
      result: { content: [{ type: "text", text: '{"status":"ok"}' }] }
    });
  }
  
  res.json({ jsonrpc, id, error: { code: -32601, message: "Method not found" } });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.error(`✅ MCP en puerto ${PORT}`));
