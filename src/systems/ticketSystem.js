import Ticket from "../core/models/Ticket.js";
import { ChannelType, PermissionFlagsBits, EmbedBuilder } from "discord.js";

export default function ticketSystem(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const ticketTypes = {
      "ticket_highstaff": { label: "High Staff", color: "#dc2626" },
      "ticket_partnership": { label: "Partnership", color: "#3b82f6" },
      "ticket_assistenza": { label: "Assistenza", color: "#6b7280" }
    };

    const type = ticketTypes[interaction.customId];
    if (!type) return;

    const user = interaction.user;
    const guild = interaction.guild;

    // 🔎 Evita doppie aperture
    const openTicket = await Ticket.findOne({ userId: user.id, status: "open" });
    if (openTicket) {
      return interaction.reply({
        content: "⚠️ Hai già un ticket aperto!",
        ephemeral: true
      });
    }

    // 🏗️ Crea il canale privato
    const channel = await guild.channels.create({
      name: `ticket-${user.username}`.toLowerCase(),
      type: ChannelType.GuildText,
      topic: `${type.label} — Aperto da ${user.tag}`,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        }
      ]
    });

    // 💾 Registra nel DB
    await Ticket.create({
      ticketId: channel.id,
      channelId: channel.id,
      userId: user.id,
      type: type.label,
      status: "open",
      createdAt: new Date()
    });

    // 📡 Messaggio iniziale
    const embed = new EmbedBuilder()
      .setTitle(`🎟️ Ticket — ${type.label}`)
      .setDescription(
        `Benvenuto <@${user.id}>!\n` +
        `Il tuo ticket è stato aperto con successo.\n\n` +
        `🧾 **Categoria:** ${type.label}\n` +
        `📅 **Orario:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
        `Attendi un membro dello staff, oppure spiega subito il tuo problema.`
      )
      .setColor(type.color)
      .setFooter({ text: "DM REALM ALPHA — Sistema Ticket" });

    await channel.send({ content: `<@${user.id}>`, embeds: [embed] });

    await interaction.reply({
      content: `✅ Ticket **${type.label}** aperto con successo: <#${channel.id}>`,
      ephemeral: true
    });
  });
}

