import { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import Ticket from "../core/models/Ticket.js";

const STAFF_LOG_CHANNEL = "1435285738185953390"; // Canale staff claim

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

    const existing = await Ticket.findOne({ userId: user.id, status: "open" });
    if (existing) {
      return interaction.reply({ content: "⚠️ Hai già un ticket aperto.", ephemeral: true });
    }

    const channel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      topic: `${type.label} — Aperto da ${user.tag}`,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ]
    });

    await Ticket.create({
      channelId: channel.id,
      userId: user.id,
      claimed: false,
      status: "open",
      type: type.label
    });

    // Pulsanti dentro al ticket
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_add_user").setLabel("➕ Aggiungi Utente").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Chiudi Ticket").setStyle(ButtonStyle.Danger)
    );

    const welcomeEmbed = new EmbedBuilder()
      .setColor(type.color)
      .setTitle(`🎟️ Ticket — ${type.label}`)
      .setDescription(
        `Salve <@${user.id}>.\n` +
        `Sono **DM Alpha**, assistenza automatica del server.\n\n` +
        `• Descrivi il problema in modo chiaro.\n` +
        `• Se l’operatore interviene, rimango in silenzio.\n\n` +
        `⏱️ Attendere l'assegnazione da parte dello Staff.`
      );

    await channel.send({ content: `<@${user.id}>`, embeds: [welcomeEmbed], components: [buttons] });

    // Log nel canale staff con pulsante reclamo
    const staffChannel = guild.channels.cache.get(STAFF_LOG_CHANNEL);

    const claimRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`claim_${channel.id}`).setLabel("🟢 Reclama Ticket").setStyle(ButtonStyle.Success)
    );

    const staffEmbed = new EmbedBuilder()
      .setColor("#22c55e")
      .setTitle("🟢 Nuovo Ticket Aperto")
      .setDescription(
        `**Tipo:** ${type.label}\n` +
        `**Utente:** <@${user.id}>\n` +
        `**Canale:** <#${channel.id}>\n\n` +
        `Premi **Reclama Ticket** per prendere in carico.`
      );

    await staffChannel.send({ embeds: [staffEmbed], components: [claimRow] });

    await interaction.reply({ content: `✅ Ticket creato: <#${channel.id}>`, ephemeral: true });
  });
}
