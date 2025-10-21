import { logEmbed } from "../core/embeds.js";
import { safeUser } from "../core/security.js";
import { sendWebhook } from "../core/logger.js";

export default function memberHandler(client, urls) {

  // 🟩 MEMBER JOIN
  client.on("guildMemberAdd", member => {
    const joinDescription = [
      "🟢 **Protocollo di ingresso completato**",
      ``,
      `Un nuovo membro ha cominciato a far parte di **${member.guild.name}**.`,
      ``,
      `👤 **Profilo**`,
      `> ${safeUser(member.user)}`,
      `> ID: ${member.id}`,
      ``,
      `📍 **Canale di ingresso**`,
      `> Registrato automaticamente`,
      ``,
      `🕒 **Orario evento**`,
      `> <t:${Math.floor(Date.now() / 1000)}:F>`,
      ``,
      `🧾 **Tracciamento**`,
      `> Azione automatica del sistema`
    ].join("\n");

    sendWebhook(
      urls.join,
      logEmbed(
        "<:join_alpha:1429888497212456970> NUOVO MEMBRO",
        joinDescription,
        0x1F6C33, // Verde autoritario
        {
          footer: {
            text: "Nihil Difficile Volenti • Sistema di Sorveglianza Attiva\nDM REALM ALPHA — Messaggio automatico"
          },
          image: {
            url: "https://media.discordapp.net/attachments/873126567134494742/1429862125177667594/file_000000002ab86246b8dd9f8e630d018f.jpg"
          },
          author: {
            name: "DM REALM ALPHA LOGGER",
            url: "https://discord.com/oauth2/authorize?client_id=1429110896910798928",
            icon_url: "https://cdn-icons-png.flaticon.com/512/892/892781.png"
          }
        }
      )
    );
  });

  // 🟥 MEMBER LEAVE
  client.on("guildMemberRemove", member => {
    const leaveDescription = [
      "🔻 **Disconnessione rilevata**",
      ``,
      `Un membro ha lasciato la community **${member.guild.name}**.`,
      ``,
      `👤 **Profilo**`,
      `> ${safeUser(member.user)}`,
      `> ID: ${member.id}`,
      ``,
      `📅 **Ultima attività rilevata**`,
      `> <t:${Math.floor(Date.now() / 1000)}:F>`,
      ``,
      `🧾 **Tracciamento**`,
      `> Evento automatico — nessun intervento manuale`
    ].join("\n");

    sendWebhook(
      urls.leave,
      logEmbed(
        "<:leave_alpha:1429889479962787882> MEMBRO USCITO",
        leaveDescription,
        0xDD2E44, // Rosso autoritario
        {
          footer: {
            text: "Nihil Difficile Volenti • Sistema di Sorveglianza Attiva\nDM REALM ALPHA — Registro attività aggiornato"
          },
          image: {
            url: "https://media.discordapp.net/attachments/873126567134494742/1429862125177667594/file_000000002ab86246b8dd9f8e630d018f.jpg"
          },
          author: {
            name: "DM REALM ALPHA LOGGER",
            url: "https://discord.com/oauth2/authorize?client_id=1429110896910798928",
            icon_url: "https://cdn-icons-png.flaticon.com/512/892/892781.png"
          }
        }
      )
    );
  });
}
