import { logEmbed } from "../core/embeds.js";
import { safeUser } from "../core/security.js";
import { sendWebhook } from "../core/logger.js";

export default function memberHandler(client, urls) {
  client.on("guildMemberAdd", member => {
    sendWebhook(urls.join, logEmbed(
      "✅ MEMBER JOIN",
      `👤 ${safeUser(member.user)} è entrato nel server.`,
      5763719
    ));
  });

  client.on("guildMemberRemove", member => {
    sendWebhook(urls.leave, logEmbed(
      "❌ MEMBER LEAVE",
      `👤 ${safeUser(member.user)} ha lasciato il server.`,
      14495300
    ));
  });
}