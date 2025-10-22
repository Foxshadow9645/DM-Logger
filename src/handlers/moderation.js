import { logEmbed } from "../core/embeds.js";
import { sendWebhook } from "../core/logger.js";
import { AuditLogEvent } from "discord.js";

const TARGET_GUILD_ID = "1413141460416598062";

export default function moderationHandler(client, urls) {
  // ───────────────────────────────
  // 🚨 BAN
  client.on("guildBanAdd", async (ban) => {
    if (ban.guild.id !== TARGET_GUILD_ID) return;

    const guild = ban.guild;
    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    let executor = null;
    let reason = null;

    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 3 });
      const entry = logs.entries.find(e => e.target?.id === ban.user.id && Date.now() - e.createdTimestamp < 10000);
      if (entry) {
        executor = entry.executor;
        reason = entry.reason;
      }
    } catch {}

    const desc = [
      `<:ban_alpha:1430570149114679367> **Utente bannato**`,
      "",
      `👤 **Target:** <@${ban.user.id}>`,
      executor ? `👮 **Moderatore:** <@${executor.id}>` : "👮 **Moderatore:** *Non identificato*",
      "",
      `📄 **Motivo:** ${reason || "*Nessuna motivazione specificata*"}`,
      `🕒 **Orario:** ${now}`,
      "",
      "🧾 **Tracciamento:** Azione disciplinare registrata automaticamente"
    ].join("\n");

    const embed = logEmbed("🚨 USER BANNED", desc, 0xe74c3c);
    embed.username = "DM Alpha";
    embed.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    sendWebhook(urls.punish, embed);

    if (!reason || reason.trim().length < 5) {
      const abuse = logEmbed(
        "⚠️ POSSIBILE ABUSO DI POTERE",
        [
          "❗ **Ban senza motivazione chiara**",
          "",
          `👮 Moderatore: ${executor ? `<@${executor.id}>` : "*Sconosciuto*"}`,
          `👤 Utente colpito: <@${ban.user.id}>`,
          "",
          `📄 Motivo: ${reason || "*Non fornito*"}`,
          `🕒 ${now}`
        ].join("\n"),
        0xff0000
      );
      abuse.username = "DM Alpha — SECURITY NODE";
      abuse.avatar_url = embed.avatar_url;
      sendWebhook(urls.punish, abuse);
    }
  });

  // ───────────────────────────────
  // 🔓 UNBAN
  client.on("guildBanRemove", async (ban) => {
    if (ban.guild.id !== TARGET_GUILD_ID) return;

    const guild = ban.guild;
    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    let executor = null;
    let reason = null;

    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 3 });
      const entry = logs.entries.find(e => e.target?.id === ban.user.id && Date.now() - e.createdTimestamp < 10000);
      if (entry) {
        executor = entry.executor;
        reason = entry.reason;
      }
    } catch {}

    const desc = [
      "🔓 **Ban revocato (unban)**",
      "",
      `👤 **Utente sbloccato:** <@${ban.user.id}>`,
      executor ? `👮 **Esecutore:** <@${executor.id}>` : "👮 **Esecutore:** *Non identificato*",
      "",
      `📄 **Motivo:** ${reason || "*Non specificato*"}`,
      `🕒 **Orario:** ${now}`,
      "",
      "🧾 **Tracciamento:** Rimozione ban registrata automaticamente"
    ].join("\n");

    const embed = logEmbed("🔓 USER UNBANNED", desc, 0x2ecc71);
    embed.username = "DM Alpha";
    embed.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    sendWebhook(urls.punish, embed);
  });
}
