import { logEmbed } from "../core/embeds.js";
import { sendWebhook } from "../core/logger.js";

export default function roleHandler(client, urls) {
  client.on("guildMemberUpdate", (oldM, newM) => {
    const added = newM.roles.cache.filter(r => !oldM.roles.cache.has(r.id));
    const removed = oldM.roles.cache.filter(r => !newM.roles.cache.has(r.id));

    added.forEach(role => {
      sendWebhook(urls.roles, logEmbed("➕ ROLE ADDED", `Aggiunto ${role.name} a ${newM.user.tag}`));
    });

    removed.forEach(role => {
      sendWebhook(urls.roles, logEmbed("➖ ROLE REMOVED", `Rimosso ${role.name} da ${newM.user.tag}`));
    });
  });
}