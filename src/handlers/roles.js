import { logEmbed } from "../core/embeds.js";
import { sendWebhook } from "../core/logger.js";
import { AuditLogEvent, PermissionsBitField } from "discord.js";

const TARGET_GUILD_ID = "1413141460416598062";

export default function roleHandler(client, urls) {
  // ───────────────────────────────
  // ✅ ASSEGNAZIONE / RIMOZIONE RUOLI
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    if (newMember.guild.id !== TARGET_GUILD_ID) return;

    const oldRoles = oldMember.roles.cache.map(r => r.id);
    const newRoles = newMember.roles.cache.map(r => r.id);

    const added = newRoles.filter(id => !oldRoles.includes(id));
    const removed = oldRoles.filter(id => !newRoles.includes(id));

    if (added.length === 0 && removed.length === 0) return;

    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    const guild = newMember.guild;
    const avatar = newMember.user.displayAvatarURL({ dynamic: true, size: 512 });

    // Audit Log → chi ha agito
    let executor = null;
    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 3 });
      const entry = logs.entries.find(e => e.target?.id === newMember.id && Date.now() - e.createdTimestamp < 10000);
      executor = entry?.executor ?? null;
    } catch (err) {
      console.error("Errore AuditLog (role add/remove):", err.message);
    }

    const lines = [];
    if (added.length)
      lines.push("🟩 **Ruoli aggiunti:** " + added.map(r => `<@&${r}>`).join(", "));
    if (removed.length)
      lines.push("🟥 **Ruoli rimossi:** " + removed.map(r => `<@&${r}>`).join(", "));

    const desc = [
      added.length && removed.length
        ? "🔄 **Aggiornamento ruoli utente**"
        : added.length
        ? "➕ **Ruolo assegnato**"
        : "➖ **Ruolo rimosso**",
      "",
      `👤 **Utente coinvolto:** <@${newMember.id}>`,
      executor ? `👮 **Esecutore:** <@${executor.id}>` : "👮 **Esecutore:** *Non identificato*",
      "",
      ...lines,
      "",
      `🕒 **Orario:** ${now}`,
      "",
      "🧾 **Tracciamento:** Aggiornamento registrato automaticamente dal sistema"
    ].join("\n");

    const embed = logEmbed(
      added.length && removed.length
        ? "🔁 ROLE UPDATE"
        : added.length
        ? "🟩 ROLE ADDED"
        : "🟥 ROLE REMOVED",
      desc,
      added.length && removed.length ? 0x3498db : added.length ? 0x2ecc71 : 0xe74c3c
    );

    embed.embeds[0].thumbnail = { url: avatar };
    embed.username = "DM Alpha";
    embed.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    sendWebhook(urls.roles, embed);
  });

  // ───────────────────────────────
  // ✏️ MODIFICHE RUOLI (nome, permessi, colore)
  client.on("roleUpdate", async (oldRole, newRole) => {
    if (newRole.guild.id !== TARGET_GUILD_ID) return;
    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;

    let executor = null;
    try {
      const logs = await newRole.guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 3 });
      const entry = logs.entries.find(e => e.target?.id === newRole.id && Date.now() - e.createdTimestamp < 10000);
      executor = entry?.executor ?? null;
    } catch (err) {
      console.error("Errore AuditLog (role update):", err.message);
    }

    const oldPerms = new PermissionsBitField(oldRole.permissions);
    const newPerms = new PermissionsBitField(newRole.permissions);

    const addedPerms = newPerms
      .toArray()
      .filter(p => !oldPerms.has(p))
      .map(p => `🟩 **+ ${p}**`);

    const removedPerms = oldPerms
      .toArray()
      .filter(p => !newPerms.has(p))
      .map(p => `🟥 **- ${p}**`);

    const permChanges = [...addedPerms, ...removedPerms].join("\n");
    const nameChanged = oldRole.name !== newRole.name;
    const colorChanged = oldRole.hexColor !== newRole.hexColor;

    if (!permChanges && !nameChanged && !colorChanged) return;

    const desc = [
      nameChanged
        ? `<:msgmodifed_alpha:1430555433365409802> **Nome ruolo modificato**`
        : "⚙️ **Permessi ruolo aggiornati**",
      "",
      `🎖️ **Ruolo:** <@&${newRole.id}>`,
      executor ? `👮 **Esecutore:** <@${executor.id}>` : "👮 **Esecutore:** *Non identificato*",
      "",
      nameChanged ? `🔤 **Prima:** ${oldRole.name}\n🔤 **Dopo:** ${newRole.name}\n` : "",
      colorChanged ? `🎨 **Colore:** ${oldRole.hexColor} ➜ ${newRole.hexColor}\n` : "",
      permChanges ? `🔧 **Permessi modificati:**\n${permChanges}` : "",
      "",
      `🕒 **Orario:** ${now}`,
      "",
      "🧾 **Tracciamento:** Aggiornamento registrato automaticamente"
    ].join("\n");

    const embed = logEmbed(
      "<:msgmodifed_alpha:1430555433365409802> ROLE UPDATED",
      desc,
      0xf1c40f
    );

    embed.username = "DM Alpha";
    embed.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    sendWebhook(urls.roles, embed);
  });

  // ───────────────────────────────
  // ❌ ELIMINAZIONE RUOLO
  client.on("roleDelete", async (role) => {
    if (role.guild.id !== TARGET_GUILD_ID) return;

    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    let executor = null;

    try {
      const logs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 3 });
      const entry = logs.entries.find(e => e.target?.id === role.id && Date.now() - e.createdTimestamp < 10000);
      executor = entry?.executor ?? null;
    } catch (err) {
      console.error("Errore AuditLog (role delete):", err.message);
    }

    const desc = [
      "<:msgdeleted_alpha:1430245864877850815> **Ruolo eliminato**",
      "",
      `🎖️ **Ruolo:** ${role.name}`,
      executor ? `👮 **Esecutore:** <@${executor.id}>` : "👮 **Esecutore:** *Non identificato*",
      "",
      `🎨 **Colore precedente:** ${role.hexColor}`,
      "",
      `🕒 **Orario:** ${now}`,
      "",
      "🧾 **Tracciamento:** Eliminazione ruolo registrata automaticamente"
    ].join("\n");

    const embed = logEmbed(
      "<:msgdeleted_alpha:1430245864877850815> ROLE DELETED",
      desc,
      0xe74c3c
    );

    embed.username = "DM Alpha";
    embed.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    sendWebhook(urls.roles, embed);
  });

  // ───────────────────────────────
  // 🟥 RIMOZIONE RUOLI SU USCITA / BAN / KICK
  client.on("guildMemberRemove", async (member) => {
    if (member.guild.id !== TARGET_GUILD_ID) return;

    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    const roles = member.roles.cache.filter(r => r.id !== member.guild.id);
    const guild = member.guild;

    // Chi ha causato l'uscita?
    let executor = null;
    try {
      const logs = await guild.fetchAuditLogs({ limit: 3 });
      const entry = logs.entries.find(
        e =>
          ["MEMBER_KICK", "MEMBER_BAN_ADD"].includes(e.actionType) &&
          e.target?.id === member.id &&
          Date.now() - e.createdTimestamp < 10000
      );
      executor = entry?.executor ?? null;
    } catch (err) {
      console.error("Errore AuditLog (member leave roles):", err.message);
    }

    const desc = [
      "🟥 **Rimozione ruoli su uscita/espulsione utente**",
      "",
      `👤 **Utente:** <@${member.id}>`,
      executor
        ? `👮 **Azione eseguita da:** <@${executor.id}>`
        : "👮 **Azione eseguita da:** *Uscita autonoma o non tracciata*",
      "",
      roles.size
        ? `🧾 **Ruoli rimossi:** ${roles.map(r => `<@&${r.id}>`).join(", ")}`
        : "🧾 **Ruoli rimossi:** Nessuno (utente privo di ruoli)",
      "",
      `🕒 **Orario:** ${now}`,
      "",
      "📡 **Tracciamento:** Evento registrato automaticamente"
    ].join("\n");

    const embed = logEmbed("🟥 ROLE REMOVED — MEMBER LEFT", desc, 0xe74c3c);
    embed.username = "DM Alpha";
    embed.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    sendWebhook(urls.roles, embed);
  });
}
