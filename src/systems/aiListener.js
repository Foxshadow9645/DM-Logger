// ─────────────────────────────────────────────
// 🧠 AI LISTENER — Customer Service & Ticket Manager
// ─────────────────────────────────────────────

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} from "discord.js";
import Ticket from "../core/models/Ticket.js";

const STAFF_ROLE = "1429034173741400125"; // 🔥 RUOLO DA TAGGARE QUANDO CHIESTO STAFF
const STAFF_CLAIM_ROLES = [
  "1429034166229663826","1429034167781294080","1429034175171792988",
  "1429034176014843944","1429034177000509451","1429034177898086491",
  "1429034178766180444","1429034179747778560","1431283077824512112"
];

export default function aiListener(client) {

  // ─────────────────────────────────────────────
  // 💬 Risposta di benvenuto “Customer Service”
  // ─────────────────────────────────────────────
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    const content = message.content.toLowerCase();
    const channel = message.channel;
    const user = message.author;

    // Considera *solo* i ticket
    if (!channel.name.startsWith("ticket-")) return;

    // Se nel ticket è già presente uno staff → il bot STA ZITTO
    if (channel.permissionOverwrites.cache.some(overwrite =>
      STAFF_CLAIM_ROLES.some(r => overwrite.id === r)
    )) return;

    // Saluti
    if (["ciao", "salve", "hey", "buonasera", "buongiorno"].some(s => content.startsWith(s))) {

      const embed = new EmbedBuilder()
        .setColor(0x1f2937)
        .setAuthor({ name: "DM Alpha — Servizio Assistenza" })
        .setDescription(
          `Salve ${user}.\n\n` +
          `💼 Sono **DM Alpha**, assistente operativo.\n` +
          `Vuoi che **un membro dello staff intervenga?**\n\n` +
          `➡️ Scrivi **voglio parlare con uno staffer**\n` +
          `⚙️ Oppure scrivi **provo a risolvere io** per diagnosi guidata.`
        )
        .setFooter({ text: "Nihil Difficile Volenti" })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ─────────────────────────────────────────────
    // 🎟️ PASSA CONVERSAZIONE A STAFF (Crea nuovo ticket staff e chiudi il vecchio)
    // ─────────────────────────────────────────────
    if (content.includes("voglio parlare con uno staffer")) {

      const guild = message.guild;

      // ✅ Crea ticket staff
      const staffTicket = await guild.channels.create({
        name: `staff-${user.username}`,
        type: ChannelType.GuildText,
        topic: `Assistenza diretta richiesta da ${user.tag}`,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: STAFF_ROLE, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });

      // Messaggio nel nuovo ticket
      await staffTicket.send({
        content: `<@${user.id}> <@&${STAFF_ROLE}>`,
        embeds: [
          new EmbedBuilder()
            .setColor(0x2563eb)
            .setTitle("🎧 Assistenza Umana Richiesta")
            .setDescription(
              `Un operatore umano sarà qui a breve.\n\n` +
              `Prepara una descrizione chiara del problema.`
            )
            .setTimestamp()
        ]
      });

      // Comunica all’utente
      await message.reply({
        content: `✅ Ho trasferito la richiesta ad un **operatore umano**: ${staffTicket}`
      });

      // 🔒 Chiudi ticket precedente
      await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed" });
      setTimeout(() => channel.delete().catch(() => {}), 4000);

      return;
    }

    // ─────────────────────────────────────────────
    // ⚙️ SUPPORTO AUTOMATICO
    // ─────────────────────────────────────────────
    if (content.includes("provo a risolvere io")) {
      const embed = new EmbedBuilder()
        .setColor(0x374151)
        .setTitle("🧠 Supporto Automatica Attivo")
        .setDescription(
          `Perfetto ${user}, descrivi il problema.\n` +
          `Il sistema proverà ad identificarlo automaticamente.`
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // ─────────────────────────────────────────────
    // 🔒 CHIUSURA MANUALE
    // ─────────────────────────────────────────────
    if (
      content.includes("chiudi il ticket") ||
      content.includes("ho risolto") ||
      content.includes("puoi chiudere")
    ) {
      await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed" });

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x9ca3af)
            .setTitle("🔒 Ticket Chiuso")
            .setDescription(`Richiesto da ${user}.`)
            .setTimestamp()
        ]
      });

      setTimeout(() => channel.delete().catch(() => {}), 4000);
    }

    // ─────────────────────────────────────────────
    // 🚨 LINGUAGGIO INAPPROPRIATO → Segnala
    // ─────────────────────────────────────────────
    if (["gay", "frocio", "negro", "insulto"].some(w => content.includes(w))) {
      await channel.send({
        content: `⚠️ <@&${STAFF_ROLE}> Linguaggio potenzialmente offensivo rilevato.`
      });
    }
  });
}
