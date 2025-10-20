import { logEmbed } from "../core/embeds.js";
import { sendWebhook } from "../core/logger.js";

export default function voiceHandler(client, urls) {
  client.on("voiceStateUpdate", (oldS, newS) => {
    if (!oldS.channel && newS.channel) {
      sendWebhook(urls.voice, logEmbed("🎙️ JOIN VOICE", `${newS.member.user.tag} è entrato in ${newS.channel.name}`));
    }
    if (oldS.channel && !newS.channel) {
      sendWebhook(urls.voice, logEmbed("📴 LEFT VOICE", `${newS.member.user.tag} è uscito da ${oldS.channel.name}`));
    }
  });
}