import theme from "../config/embed-theme.json" assert { type: "json" };
import { traceID } from "./trace.js";

export function logEmbed(title, description, color = theme.color.primary, fields = []) {
  return {
    embeds: [
      {
        title,
        description,
        color,
        fields,
        image: { url: theme.banner },
        footer: { text: `${theme.footer} • ${traceID()}` },
        timestamp: new Date().toISOString()
      }
    ]
  };
}
