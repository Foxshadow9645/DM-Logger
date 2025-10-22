import { logEmbed } from "../core/embeds.js";
import { sendWebhook } from "../core/logger.js";

const TARGET_GUILD_ID = "1413141460416598062";

const invitesCache = new Map();

export default function inviteHandler(client, urls) {
  // ───────────────────────────────
  // 📡 CACHE INVITI ALL’AVVIO
  client.on("ready", async () => {
    try {
      const guild = client.guilds.cache.get(TARGET_GUILD_ID);
      if (!guild) return console.log("⚠️ Guild target non trovata per la cache inviti.");
      const invites = await guild.invites.fetch();
      invitesCache.set(guild.id, new Map(invites.map(inv => [inv.code, inv.uses])));
      console.log("📈 Cache inviti caricata per DM REALM ALPHA");
    } catch (err) {
      console.error("Errore caricamento cache inviti:", err);
    }
  });

  // ───────────────────────────────
  // 🔁 AGGIORNA CACHE QUANDO UN INVITO VIENE CREATO O ELIMINATO
  client.on("inviteCreate", (invite) => {
    if (invite.guild.id !== TARGET_GUILD_ID) return;
    const guildInvites = invitesCache.get(invite.guild.id) || new Map();
    guildInvites.set(invite.code, invite.uses ?? 0);
    invitesCache.set(invite.guild.id, guildInvites);
  });

  client.on("inviteDelete", (invite) => {
    if (invite.guild.id !== TARGET_GUILD_ID) return;
    const guildInvites = invitesCache.get(invite.guild.id) || new Map();
    guildInvites.delete(invite.code);
    invitesCache.set(invite.guild.id, guildInvites);
  });

  // ───────────────────────────────
  // 🎯 MEMBRO ENTRATO — TRACCIA INVITO USATO
  client.on("guildMemberAdd", async (member) => {
    if (member.guild.id !== TARGET_GUILD_ID) return;
    const guild = member.guild;
    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;

    let inviter = null;
    let usedInvite = null;

    try {
      const newInvites = await guild.invites.fetch();
      const oldInvites = invitesCache.get(guild.id) || new Map();

      // Trova invito incrementato
      usedInvite = newInvites.find(inv => inv.uses > (oldInvites.get(inv.code) || 0));
      if (usedInvite) inviter = usedInvite.inviter;

      // Aggiorna cache
      invitesCache.set(guild.id, new Map(newInvites.map(inv => [inv.code, inv.uses])));
    } catch (err) {
      console.error("Errore tracciamento invito:", err.message);
    }

    // 🪪 Costruzione messaggio
    const desc = [
      `<:invite_alpha:1430579330836332668> **Nuovo ingresso nel server**`,
      "",
      `👤 **Membro:** <@${member.id}>`,
      inviter
        ? `🧭 **Invitato da:** <@${inviter.id}>`
        : "🧭 **Invitato da:** *Non rilevato (forse link personalizzato o evento temporaneo)*",
      "",
      usedInvite
        ? `🔗 **Codice:** \`${usedInvite.code}\`\n📈 **Utilizzi:** ${usedInvite.uses} (↑ +1)`
        : "🔗 **Codice:** *Non disponibile*",
      "",
      `🕒 **Orario:** ${now}`,
      "",
      "🧾 **Tracciamento:** Invito registrato dal sistema DM REALM ALPHA"
    ].join("\n");

    const embed = logEmbed(
      "<:invite_alpha:1430579330836332668> MEMBER INVITE TRACKED",
      desc,
      0x3498db
    );

    embed.username = "DM Alpha";
    embed.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    sendWebhook(urls.invites, embed);
  });
}
