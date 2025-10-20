import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { traceID } from "./trace.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carica JSON embed senza assert (compatibile Railway/Node16)
const theme = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../config/embed-theme.json"), "utf8")
);

export function logEmbed(title, description, color = theme.color.primary, fields = []) {
  return {
    embeds: [
      {
        title,
        description,
        color,
        fields,
        image: { url: theme.banner },
        footer: { text: `${theme.footer} • TRACE ${traceID()}` },
        timestamp: new Date().toISOString()
      }
    ]
  };
}
