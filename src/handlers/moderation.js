import { logEmbed } from "../core/embeds.js";
import { safeUser } from "../core/security.js";
import { sendWebhook } from "../core/logger.js";

export default function moderationHandler(client, urls) {
  client.on("guildBanAdd", ban => {
    sendWebhook(urls.punish, logEmbed(
      "🔨 USER BANNED",
      `👤 Target: ${safeUser(ban.user)}`
    ));
  });
}