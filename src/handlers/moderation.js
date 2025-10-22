import { logEmbed } from "../core/embeds.js";
import { sendWebhook } from "../core/logger.js";
import { AuditLogEvent } from "discord.js";

const TARGET_GUILD_ID = "1413141460416598062";

export default function moderationHandler(client, urls) {
  // ─────────────────────────────────────────────
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
    } catch (err) {
      console.error("Errore AuditLog (ban):", err.message);
    }

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

    // ─── Possibile abuso (assenza motivazione)
    if (!reason || reason.trim().length < 5) {
      const abuse = logEmbed(
        "⚠️ POSSIBILE ABUSO DI POTERE",
        [
          "❗ **Punizione senza motivazione chiara**",
          "",
          `👮 Moderatore: ${executor ? `<@${executor.id}>` : "*Sconosciuto*"}`,
          `👤 Utente colpito: <@${ban.user.id}>`,
          "",
          `📄 Motivo: ${reason || "*Non fornito*"}`,
          "",
          `🕒 ${now}`
        ].join("\n"),
        0xff0000
      );
      abuse.username = "DM Alpha — SECURITY NODE";
      abuse.avatar_url = embed.avatar_url;
      sendWebhook(urls.punish, abuse);
    }
  });

  // ─────────────────────────────────────────────
  // 🚪 KICK
  client.on("guildMemberRemove", async (member) => {
    if (member.guild.id !== TARGET_GUILD_ID) return;
    const guild = member.guild;
    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    let executor = null;
    let reason = null;

    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 3 });
      const entry = logs.entries.find(e => e.target?.id === member.id && Date.now() - e.createdTimestamp < 10000);
      if (entry) {
        executor = entry.executor;
        reason = entry.reason;
      }
    } catch (err) {
      console.error("Errore AuditLog (kick):", err.message);
    }

    if (!executor) return; // se non è un kick ma una semplice uscita, ignora

    const desc = [
      `<:kick_alpha:1430570033549017160> **Utente espulso (Kick)**`,
      "",
      `👤 **Target:** <@${member.id}>`,
      `👮 **Moderatore:** <@${executor.id}>`,
      "",
      `📄 **Motivo:** ${reason || "*Nessuna motivazione specificata*"}`,
      `🕒 **Orario:** ${now}`,
      "",
      "🧾 **Tracciamento:** Espulsione registrata automaticamente"
    ].join("\n");

    const embed = logEmbed("🚪 USER KICKED", desc, 0xf39c12);
    embed.username = "DM Alpha";
    embed.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    sendWebhook(urls.punish, embed);

    if (!reason || reason.trim().length < 5) {
      const abuse = logEmbed(
        "⚠️ POSSIBILE ABUSO DI POTERE",
        [
          "❗ **Kick senza motivazione chiara**",
          "",
          `👮 Moderatore: <@${executor.id}>`,
          `👤 Utente colpito: <@${member.id}>`,
          "",
          `📄 Motivo: ${reason || "*Non fornito*"}`,
          "",
          `🕒 ${now}`
        ].join("\n"),
        0xff0000
      );
      abuse.username = "DM Alpha — SECURITY NODE";
      abuse.avatar_url = embed.avatar_url;
      sendWebhook(urls.punish, abuse);
    }
  });

  // ─────────────────────────────────────────────
  // ⏳ TIMEOUT (mute temporaneo)
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    if (newMember.guild.id !== TARGET_GUILD_ID) return;

    const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
    const newTimeout = newMember.communicationDisabledUntilTimestamp;

    if (oldTimeout === newTimeout) return; // nessun cambiamento

    const guild = newMember.guild;
    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    let executor = null;
    let reason = null;

    try {
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberUpdate, limit: 3 });
      const entry = logs.entries.find(
        e =>
          e.target?.id === newMember.id &&
          e.changes?.some(c => c.key === "communication_disabled_until") &&
          Date.now() - e.createdTimestamp < 10000
      );
      if (entry) {
        executor = entry.executor;
        reason = entry.reason;
      }
    } catch (err) {
      console.error("Errore AuditLog (timeout):", err.message);
    }

    const isTimeoutApplied = newTimeout && (!oldTimeout || newTimeout > Date.now());

    const desc = [
      isTimeoutApplied
        ? `<:timeout_alpha:1430232769992065095> **Timeout applicato**`
        : `🔓 **Timeout rimosso**`,
      "",
      `👤 **Utente:** <@${newMember.id}>`,
      executor ? `👮 **Moderatore:** <@${executor.id}>` : "👮 **Moderatore:** *Non identificato*",
      "",
      reason ? `📄 **Motivo:** ${reason}` : "📄 **Motivo:** *Non specificato*",
      "",
      isTimeoutApplied
        ? `⏱️ **Durata:** Fino al <t:${Math.floor(newTimeout / 1000)}:F>`
        : "",
      "",
      `🕒 **Orario:** ${now}`,
      "",
      "🧾 **Tracciamento:** Azione disciplinare registrata automaticamente"
    ].join("\n");

    const embed = logEmbed(
      isTimeoutApplied ? "⏳ USER TIMEOUT" : "🔓 TIMEOUT REMOVED",
      desc,
      isTimeoutApplied ? 0x7289da : 0x2ecc71
    );
    embed.username = "DM Alpha";
    embed.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    sendWebhook(urls.punish, embed);

    // Abuso sospetto
    if (isTimeoutApplied && (!reason || reason.trim().length < 5)) {
      const abuse = logEmbed(
        "⚠️ POSSIBILE ABUSO DI POTERE",
        [
          "❗ **Timeout applicato senza motivazione chiara**",
          "",
          `👮 Moderatore: ${executor ? `<@${executor.id}>` : "*Sconosciuto*"}`,
          `👤 Utente colpito: <@${newMember.id}>`,
          "",
          `📄 Motivo: ${reason || "*Non fornito*"}`,
          "",
          `🕒 ${now}`
        ].join("\n"),
        0xff0000
      );
      abuse.username = "DM Alpha — SECURITY NODE";
      abuse.avatar_url = embed.avatar_url;
      sendWebhook(urls.punish, abuse);
    }
  });
}
