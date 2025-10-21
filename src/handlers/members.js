import { logEmbed } from "../core/embeds.js";
import { safeUser } from "../core/security.js";
import { sendWebhook } from "../core/logger.js";

export default function memberHandler(client, urls) {

  // 🟩 MEMBER JOIN
  client.on("guildMemberAdd", async member => {

    const totalMembers = member.guild.memberCount;
    const createdAt = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`;
    const joinedAt = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    const avatarURL = member.user.displayAvatarURL({ dynamic: true, size: 512 });
    const isBot = member.user.bot ? "🤖 **Bot Account**" : "👤 **Utente umano**";

    const joinDesc = [
      "🟢 **Protocollo di ingresso completato**",
      "",
      `L’utente <@${member.id}> è entrato nella community **${member.guild.name}**.`,
      "",
      `${isBot}`,
      "",
      `📇 **Profilo utente**`,
      `> Tag: ${member.user.tag}`,
      `> ID: ${member.id}`,
      `> Account creato: ${createdAt}`,
      `> Avatar: [clicca qui](${avatarURL})`,
      "",
      `📍 **Ingresso rilevato**`,
      `> Canale: Registrato automaticamente`,
      `> Orario: ${joinedAt}`,
      "",
      `📈 **Aggiornamento server**`,
      `> Totale membri attuali: **${totalMembers}**`,
      "",
      `🧾 **Tracciamento**`,
      `> Azione automatica del sistema di sorveglianza`
    ].join("\n");

    const embed = logEmbed(
      "<:join_alpha:1429888497212456970> NUOVO MEMBRO",
      joinDesc,
      0x1F6C33
    );

    embed.embeds[0].author = {
      name: "DM REALM ALPHA LOGGER",
      url: "https://discord.com/oauth2/authorize?client_id=1429110896910798928",
      icon_url: "https://cdn-icons-png.flaticon.com/512/892/892781.png"
    };
    embed.embeds[0].footer = {
      text: "Nihil Difficile Volenti • Sistema di Sorveglianza Attiva\nDM REALM ALPHA — Registro d’ingresso aggiornato"
    };
    embed.embeds[0].thumbnail = { url: avatarURL };
    embed.embeds[0].image = {
      url: "https://media.discordapp.net/attachments/873126567134494742/1429862125177667594/file_000000002ab86246b8dd9f8e630d018f.jpg"
    };

    embed.username = "DM Alpha";
    embed.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    await sendWebhook(urls.join, embed);
  });

  // 🟥 MEMBER LEAVE
  client.on("guildMemberRemove", async member => {
    const totalMembers = member.guild.memberCount;
    const createdAt = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`;
    const leftAt = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    const avatarURL = member.user.displayAvatarURL({ dynamic: true, size: 512 });
    const isBot = member.user.bot ? "🤖 **Bot Account**" : "👤 **Utente umano**";

    const leaveDesc = [
      "🔻 **Disconnessione rilevata**",
      "",
      `L’utente <@${member.id}> ha lasciato la community **${member.guild.name}**.`,
      "",
      `${isBot}`,
      "",
      `📇 **Profilo utente**`,
      `> Tag: ${member.user.tag}`,
      `> ID: ${member.id}`,
      `> Account creato: ${createdAt}`,
      `> Avatar: [clicca qui](${avatarURL})`,
      "",
      `📅 **Uscita registrata**`,
      `> Orario: ${leftAt}`,
      "",
      `📉 **Aggiornamento server**`,
      `> Totale membri attuali: **${totalMembers}**`,
      "",
      `🧾 **Tracciamento**`,
      `> Evento automatico — nessun intervento manuale`
    ].join("\n");

    const embed = logEmbed(
      "<:leave_alpha:1429889479962787882> MEMBRO USCITO",
      leaveDesc,
      0xDD2E44
    );

    embed.embeds[0].author = {
      name: "DM REALM ALPHA LOGGER",
      url: "https://discord.com/oauth2/authorize?client_id=1429110896910798928",
      icon_url: "https://cdn-icons-png.flaticon.com/512/892/892781.png"
    };
    embed.embeds[0].footer = {
      text: "Nihil Difficile Volenti • Sistema di Sorveglianza Attiva\nDM REALM ALPHA — Registro attività aggiornato"
    };
    embed.embeds[0].thumbnail = { url: avatarURL };
    embed.embeds[0].image = {
      url: "https://media.discordapp.net/attachments/873126567134494742/1429862125177667594/file_000000002ab86246b8dd9f8e630d018f.jpg"
    };

    embed.username = "DM Alpha";
    embed.avatar_url =
      "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";

    await sendWebhook(urls.leave, embed);
  });
}
