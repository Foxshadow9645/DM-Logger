import { logEmbed } from "../core/embeds.js";
import { sendWebhook } from "../core/logger.js";

export default function inviteHandler(client, urls) {
  client.on("inviteCreate", invite => {
    sendWebhook(urls.invites, logEmbed("🔗 INVITE CREATED", `Creato da ${invite.inviter.tag} → ${invite.code}`));
  });
}