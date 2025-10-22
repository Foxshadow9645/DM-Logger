import { logEmbed } from "../core/embeds.js";
import { sendWebhook } from "../core/logger.js";
import { AuditLogEvent } from "discord.js";

const TARGET_GUILD_ID = "1413141460416598062";

export default function messageHandler(client, urls) {
  // ─────────────── MESSAGE DELETE ───────────────
  client.on("messageDelete", async (message) => {
    if (!message.guild || message.guild.id !== TARGET_GUILD_ID) return;
    if (message.author?.bot) return;

    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    const avatar = message.author.displayAvatarURL({ dynamic: true, size: 512 });
    const baseEmbed = {
      author: {
        name: "DM REALM ALPHA LOGGER",
        icon_url: "https://cdn-icons-png.flaticon.com/512/892/892781.png",
        url: "https://discord.com/oauth2/authorize?client_id=1429110896910798928"
      },
      footer: {
        text: "Nihil Difficile Volenti • Sistema di Sorveglianza Attiva\nDM REALM ALPHA — Registro messaggi"
      },
      thumbnail: { url: avatar },
      image: {
        url: "https://media.discordapp.net/attachments/873126567134494742/1429862125177667594/file_000000002ab86246b8dd9f8e630d018f.jpg"
      }
    };

    const embedBase = (title, desc, color) => {
      const e = logEmbed(title, desc, color);
      Object.assign(e.embeds[0], baseEmbed);
      e.username = "DM Alpha";
      e.avatar_url =
        "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";
      return e;
    };

    // Recupera eventuale moderatore dall’Audit Log
    let executor = null;
    try {
      const logs = await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete, limit: 1 });
      const entry = logs.entries.first();
      if (entry && entry.target?.id === message.author?.id && Date.now() - entry.createdTimestamp < 3000) {
        executor = entry.executor;
      }
    } catch (err) {
      console.error("Errore audit log (message delete):", err.message);
    }

    const isModerator = !!executor;
    const desc = [
      isModerator ? "🚨 **Messaggio eliminato da moderatore**" : "🗑️ **Messaggio eliminato dall'autore**",
      "",
      `💬 **Autore originale:** <@${message.author.id}>`,
      isModerator ? `👮 **Moderatore:** <@${executor.id}>` : "",
      `📍 **Canale:** <#${message.channel.id}>`,
      "",
      `🕒 **Orario:** ${now}`,
      "",
      `📄 **Contenuto:**`,
      message.content
        ? `> ${message.content.slice(0, 1000)}`
        : "*[Contenuto non disponibile]*",
      "",
      "🧾 **Tracciamento:** Evento registrato automaticamente dal sistema"
    ].join("\n");

    const embed = embedBase(
      "<:msgdeleted_alpha:1430245864877850815> MESSAGE DELETED",
      desc,
      isModerator ? 0xe74c3c : 0xdd2e44
    );

    sendWebhook(urls.messages, embed);
  });

  // ─────────────── MESSAGE UPDATE ───────────────
  client.on("messageUpdate", async (oldMessage, newMessage) => {
    if (!newMessage.guild || newMessage.guild.id !== TARGET_GUILD_ID) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // ignorare embed o pin

    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    const avatar = newMessage.author.displayAvatarURL({ dynamic: true, size: 512 });

    const baseEmbed = {
      author: {
        name: "DM REALM ALPHA LOGGER",
        icon_url: "https://cdn-icons-png.flaticon.com/512/892/892781.png",
        url: "https://discord.com/oauth2/authorize?client_id=1429110896910798928"
      },
      footer: {
        text: "Nihil Difficile Volenti • Sistema di Sorveglianza Attiva\nDM REALM ALPHA — Registro messaggi"
      },
      thumbnail: { url: avatar },
      image: {
        url: "https://media.discordapp.net/attachments/873126567134494742/1429862125177667594/file_000000002ab86246b8dd9f8e630d018f.jpg"
      }
    };

    const embedBase = (title, desc, color) => {
      const e = logEmbed(title, desc, color);
      Object.assign(e.embeds[0], baseEmbed);
      e.username = "DM Alpha";
      e.avatar_url =
        "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";
      return e;
    };

    const desc = [
      "✏️ **Messaggio modificato**",
      "",
      `👤 **Autore:** <@${newMessage.author.id}>`,
      `📍 **Canale:** <#${newMessage.channel.id}>`,
      "",
      `🕒 **Orario:** ${now}`,
      "",
      `💭 **Prima:**`,
      oldMessage.content ? `> ${oldMessage.content.slice(0, 1000)}` : "*[Non disponibile]*",
      "",
      `💭 **Dopo:**`,
      newMessage.content ? `> ${newMessage.content.slice(0, 1000)}` : "*[Non disponibile]*",
      "",
      "🧾 **Tracciamento:** Modifica messaggio registrata automaticamente"
    ].join("\n");

    const embed = embedBase(
      "<:msgmodifed_alpha:1430555433365409802> MESSAGE EDITED",
      desc,
      0x3498db
    );

    sendWebhook(urls.messages, embed);
  });
}
