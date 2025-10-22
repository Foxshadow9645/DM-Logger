import { logEmbed } from "../core/embeds.js";
import { sendWebhook } from "../core/logger.js";
import { AuditLogEvent } from "discord.js";

const TARGET_GUILD_ID = "1413141460416598062";
const MAX_SNAPSHOTS = 5000;

// 🧠 Cache messaggi (snapshot)
const MESSAGE_SNAPSHOT = new Map();
function saveSnapshot(msg) {
  if (!msg || !msg.id) return;
  MESSAGE_SNAPSHOT.set(msg.id, {
    content: typeof msg.content === "string" ? msg.content : null,
    authorId: msg.author?.id ?? null,
    channelId: msg.channel?.id ?? null,
    editedAt: msg.editedTimestamp ?? null
  });
  if (MESSAGE_SNAPSHOT.size > MAX_SNAPSHOTS) {
    const oldest = MESSAGE_SNAPSHOT.keys().next().value;
    MESSAGE_SNAPSHOT.delete(oldest);
  }
}

// 🔒 ID dei canali di log (per protezione)
const PROTECTED_WEBHOOK_URLS = new Set([
  process.env.WEBHOOK_MESSAGES,
  process.env.WEBHOOK_VOICE,
  process.env.WEBHOOK_JOIN,
  process.env.WEBHOOK_LEAVE,
  process.env.WEBHOOK_PUNISH,
  process.env.WEBHOOK_ROLES,
  process.env.WEBHOOK_INVITES
]);

export default function messageHandler(client, urls) {
  // Snapshot iniziale
  client.on("messageCreate", (message) => {
    if (!message.guild || message.guild.id !== TARGET_GUILD_ID) return;
    if (message.author?.bot) return;
    saveSnapshot(message);
  });

  // ─────────────────────────────────────────────
  // ✏️ MESSAGE UPDATE
  client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (!newMessage.guild || newMessage.guild.id !== TARGET_GUILD_ID) return;
    if (newMessage.author?.bot) return;

    try {
      if (oldMessage?.partial) await oldMessage.fetch();
      if (newMessage?.partial) await newMessage.fetch();
    } catch {}

    const snap = MESSAGE_SNAPSHOT.get(newMessage.id);
    const before = oldMessage?.content ?? snap?.content ?? null;
    const after = newMessage?.content ?? null;
    if ((before ?? "") === (after ?? "")) return;
    saveSnapshot(newMessage);

    const now = `<t:${Math.floor(Date.now()/1000)}:F>`;
    const avatar = newMessage.author.displayAvatarURL({ dynamic: true, size: 512 });

    const desc = [
      "✏️ **Messaggio modificato**",
      "",
      `👤 **Autore:** <@${newMessage.author.id}>`,
      `📍 **Canale:** <#${newMessage.channel.id}>`,
      "",
      `🕒 **Orario:** ${now}`,
      "",
      `💭 **Prima:**`,
      before ? `> ${before.slice(0,1000)}` : "*[Non disponibile]*",
      "",
      `💭 **Dopo:**`,
      after ? `> ${after.slice(0,1000)}` : "*[Non disponibile]*",
      "",
      "🧾 **Tracciamento:** Modifica registrata automaticamente"
    ].join("\n");

    const e = logEmbed("<:msgmodifed_alpha:1430555433365409802> MESSAGE EDITED", desc, 0x3498db);
    e.embeds[0].thumbnail = { url: avatar };
    e.embeds[0].author = {
      name: "DM REALM ALPHA LOGGER",
      url: "https://discord.com/oauth2/authorize?client_id=1429110896910798928",
      icon_url: "https://cdn-icons-png.flaticon.com/512/892/892781.png"
    };
    e.embeds[0].footer = { text: "Nihil Difficile Volenti • Sistema di Sorveglianza Attiva" };
    e.username = "DM Alpha";
    e.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    sendWebhook(urls.messages, e);
  });

  // ─────────────────────────────────────────────
  // 🗑️ MESSAGE DELETE
  client.on("messageDelete", async (message) => {
    if (!message.guild || message.guild.id !== TARGET_GUILD_ID) return;

    try {
      if (message?.partial) await message.fetch();
    } catch {}

    // Controllo anti-log-delete: se il messaggio cancellato è del logger stesso
    const selfWebhook = PROTECTED_WEBHOOK_URLS.has(message.webhookId);
    if (selfWebhook) {
      const now = `<t:${Math.floor(Date.now()/1000)}:F>`;
      let executor = null;
      try {
        const logs = await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 3 });
        const entry = logs.entries.find(e => e.target?.id === message.author?.id && Date.now() - e.createdTimestamp < 10_000);
        executor = entry?.executor ?? null;
      } catch {}
      const desc = [
        "⚠️ **Tentativo di rimozione log rilevato**",
        "",
        executor
          ? `👮 **Esecutore:** <@${executor.id}>`
          : "👮 **Esecutore:** *Non identificato*",
        "",
        `📍 **Canale:** <#${message.channelId}>`,
        `🕒 **Orario:** ${now}`,
        "",
        "🚫 **Tracciamento:** Protezione attiva — manomissione dei log registrata"
      ].join("\n");

      const e = logEmbed("🚨 ANTI-LOG SYSTEM ALERT", desc, 0xff0000);
      e.username = "DM Alpha – Security Node";
      e.avatar_url =
        "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";
      return sendWebhook(urls.punish || urls.messages, e);
    }

    // Normale eliminazione messaggio
    const authorId = message.author?.id ?? MESSAGE_SNAPSHOT.get(message.id)?.authorId;
    const channelId = message.channel?.id ?? MESSAGE_SNAPSHOT.get(message.id)?.channelId;
    const cached = MESSAGE_SNAPSHOT.get(message.id);
    const content = message.content ?? cached?.content ?? null;
    const now = `<t:${Math.floor(Date.now()/1000)}:F>`;
    let executor = null;

    try {
      const logs = await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 5 });
      executor = logs.entries.find(e =>
        e.target?.id === authorId &&
        Date.now() - e.createdTimestamp < 10_000
      )?.executor ?? null;
    } catch {}

    const isModerator = !!executor && executor.id !== authorId;

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
      content ? `> ${content.slice(0,1000)}` : "*[Non disponibile — messaggio non in cache]*",
      "",
      "🧾 **Tracciamento:** Evento registrato automaticamente"
    ].join("\n");

    const e = logEmbed("<:msgdeleted_alpha:1430245864877850815> MESSAGE DELETED", desc, isModerator ? 0xe74c3c : 0xdd2e44);
    e.username = "DM Alpha";
    e.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";
    sendWebhook(urls.messages, e);

    MESSAGE_SNAPSHOT.delete(message.id);
  });
}
