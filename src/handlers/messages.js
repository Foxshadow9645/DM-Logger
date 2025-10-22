import { logEmbed } from "../core/embeds.js";
import { sendWebhook } from "../core/logger.js";
import { AuditLogEvent } from "discord.js";

const TARGET_GUILD_ID = "1413141460416598062";
const LOGGER_ID = "1429110896910798928"; // ID del bot/logger
const MAX_SNAPSHOTS = 5000;
const MESSAGE_SNAPSHOT = new Map();

function saveSnapshot(msg) {
  if (!msg || !msg.id) return;
  MESSAGE_SNAPSHOT.set(msg.id, {
    content: typeof msg.content === "string" ? msg.content : null,
    authorId: msg.author?.id ?? null,
    channelId: msg.channel?.id ?? null
  });
  if (MESSAGE_SNAPSHOT.size > MAX_SNAPSHOTS) {
    const oldest = MESSAGE_SNAPSHOT.keys().next().value;
    MESSAGE_SNAPSHOT.delete(oldest);
  }
}

export default function messageHandler(client, urls) {
  client.on("messageCreate", (m) => {
    if (!m.guild || m.guild.id !== TARGET_GUILD_ID) return;
    saveSnapshot(m);
  });

  // ─────────────────────────────────────────────
  // 🗑️ MESSAGE DELETE
  client.on("messageDelete", async (message) => {
    if (!message.guild || message.guild.id !== TARGET_GUILD_ID) return;

    // se partial, fetch
    try { if (message?.partial) await message.fetch(); } catch {}

    const authorId = message.author?.id ?? MESSAGE_SNAPSHOT.get(message.id)?.authorId;
    const content = message.content ?? MESSAGE_SNAPSHOT.get(message.id)?.content ?? "*[Contenuto non disponibile]*";
    const channelId = message.channel?.id ?? MESSAGE_SNAPSHOT.get(message.id)?.channelId;
    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;

    // Rileva chi ha cancellato dal log
    let executor = null;
    try {
      const logs = await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 5 });
      const entry = logs.entries.find(
        e =>
          e.target?.id === authorId ||
          (message.webhookId && e.extra?.channel?.id === channelId)
      );
      if (entry && Date.now() - entry.createdTimestamp < 10000) executor = entry.executor;
    } catch (err) {
      console.error("Errore AuditLog:", err.message);
    }

    const isLogMessage = authorId === LOGGER_ID || !!message.webhookId;

    // Caso 1: 🔒 Tentativo di cancellare un log
    if (isLogMessage) {
      const desc = [
        "🚨 **Tentativo di manomissione log rilevato**",
        "",
        executor
          ? `👮 **Esecutore:** <@${executor.id}>`
          : "👮 **Esecutore:** *Non identificato*",
        "",
        `📍 **Canale:** <#${channelId}>`,
        `🕒 **Orario:** ${now}`,
        "",
        `🧾 **Contenuto del log cancellato:**`,
        content ? `> ${content.slice(0, 1000)}` : "*[Nessun contenuto registrato]*",
        "",
        "⚠️ **Tracciamento:** Intervento registrato come violazione del sistema di sorveglianza."
      ].join("\n");

      const embed = logEmbed("🔒 SECURITY BREACH — LOG DELETION", desc, 0xff0000);
      embed.username = "DM Alpha — SECURITY NODE";
      embed.avatar_url =
        "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";
      return sendWebhook(urls.punish || urls.messages, embed);
    }

    // Caso 2: messaggio normale cancellato
    const isModerator = executor && executor.id !== authorId;
    const desc = [
      isModerator ? "🚨 **Messaggio eliminato da moderatore**" : "🗑️ **Messaggio eliminato dall’autore**",
      "",
      authorId ? `💬 **Autore originale:** <@${authorId}>` : "💬 **Autore originale:** *Sconosciuto*",
      isModerator ? `👮 **Moderatore:** <@${executor.id}>` : "",
      channelId ? `📍 **Canale:** <#${channelId}>` : "",
      "",
      `🕒 **Orario:** ${now}`,
      "",
      `📄 **Contenuto:**`,
      content ? `> ${content.slice(0, 1000)}` : "*[Non disponibile]*",
      "",
      "🧾 **Tracciamento:** Evento registrato automaticamente"
    ].join("\n");

    const embed = logEmbed(
      "<:msgdeleted_alpha:1430245864877850815> MESSAGE DELETED",
      desc,
      isModerator ? 0xe74c3c : 0xdd2e44
    );
    embed.username = "DM Alpha";
    embed.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    sendWebhook(urls.messages, embed);
  });

  // ─────────────────────────────────────────────
  // ✏️ MESSAGE UPDATE
  client.on("messageUpdate", async (oldMsg, newMsg) => {
    if (!newMsg.guild || newMsg.guild.id !== TARGET_GUILD_ID) return;
    if (newMsg.author?.bot) return;

    try {
      if (oldMsg.partial) await oldMsg.fetch();
      if (newMsg.partial) await newMsg.fetch();
    } catch {}

    const snap = MESSAGE_SNAPSHOT.get(newMsg.id);
    const before = oldMsg.content ?? snap?.content ?? "";
    const after = newMsg.content ?? "";
    if (before === after) return;
    saveSnapshot(newMsg);

    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    const avatar = newMsg.author.displayAvatarURL({ dynamic: true, size: 512 });

    const desc = [
      "✏️ **Messaggio modificato**",
      "",
      `👤 **Autore:** <@${newMsg.author.id}>`,
      `📍 **Canale:** <#${newMsg.channel.id}>`,
      "",
      `🕒 **Orario:** ${now}`,
      "",
      `💭 **Prima:**`,
      before ? `> ${before.slice(0, 1000)}` : "*[Non disponibile]*",
      "",
      `💭 **Dopo:**`,
      after ? `> ${after.slice(0, 1000)}` : "*[Non disponibile]*",
      "",
      "🧾 **Tracciamento:** Modifica registrata automaticamente"
    ].join("\n");

    const embed = logEmbed(
      "<:msgmodifed_alpha:1430555433365409802> MESSAGE EDITED",
      desc,
      0x3498db
    );
    embed.username = "DM Alpha";
    embed.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    sendWebhook(urls.messages, embed);
  });
}
