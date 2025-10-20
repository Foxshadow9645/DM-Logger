import { logEmbed } from "../core/embeds.js";
import { safeUser } from "../core/security.js";
import { sendWebhook } from "../core/logger.js";

export default function messageHandler(client, urls) {
  client.on("messageDelete", msg => {
    if (!msg.author) return;
    sendWebhook(urls.messages, logEmbed(
      "🗑️ MESSAGE DELETED",
      `👤 Autore: ${safeUser(msg.author)}\n📄 Contenuto: ${msg.content || "(vuoto)"}`
    ));
  });

  client.on("messageUpdate", (oldMsg, newMsg) => {
    if (!oldMsg.author) return;
    sendWebhook(urls.messages, logEmbed(
      "✏️ MESSAGE EDITED",
      `👤 Autore: ${safeUser(oldMsg.author)}\n🔁 Prima: ${oldMsg.content}\n✅ Dopo: ${newMsg.content}`
    ));
  });
}