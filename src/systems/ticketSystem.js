import fs from "fs";
import path from "path";
import Ticket from "../core/models/Ticket.js";
import { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const TICKETS_FILE = path.resolve("src/data/activeTickets.json");

// Carica Ticket attivi + Contatore numerazione
let ACTIVE_TICKETS = new Set();
let COUNTER = 1;

try {
  const data = JSON.parse(fs.readFileSync(TICKETS_FILE));
  ACTIVE_TICKETS = new Set(data.active || []);
  COUNTER = data.counter || 1;
} catch {}

// Salvataggio persistente
function saveTickets() {
  fs.writeFileSync(TICKETS_FILE, JSON.stringify({
    active: [...ACTIVE_TICKETS],
    counter: COUNTER
  }, null, 2));
}

export default function ticketSystem(client) {

  // ─────────────────────────────────────────────
  // 🎟️ Creazione Ticket
  // ─────────────────────────────────────────────
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

    // Anti-Spam: se l’utente ha già un ticket aperto → stop
    const openTicket = await Ticket.findOne({ userId: user.id, status: "open" });
    if (openTicket) {
      return interaction.reply({ content: "⚠️ Hai già un ticket aperto.", ephemeral: true });
    }

    // Numerazione ticket
    const ticketNumber = String(COUNTER).padStart(3, "0");
    COUNTER++;
    saveTickets();

    // Crea canale
    const channel = await guild.channels.create({
      name: `ticket-${ticketNumber}`,
      type: ChannelType.GuildText,
      topic: `${type.label} — Aperto da ${user.tag}`,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
      ]
    });

    ACTIVE_TICKETS.add(channel.id);
    saveTickets();

    await Ticket.create({
      ticketId: channel.id,
      channelId: channel.id,
      userId: user.id,
      type: type.label,
      status: "open",
      createdAt: new Date()
    });

    // Bottone chiusura
    const closeButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("🔒 Chiudi Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setTitle(`🎟️ Ticket — ${type.label}`)
      .setDescription(`Benvenuto <@${user.id}>!\n\nSpiega il tuo problema in modo chiaro.\nUno staffer risponderà appena possibile.`)
      .setColor(type.color);

    await channel.send({ content: `<@${user.id}>`, embeds: [embed], components: [closeButton] });

    await interaction.reply({ content: `✅ Ticket aperto: <#${channel.id}>`, ephemeral: true });
  });

  // ─────────────────────────────────────────────
  // 🔒 Chiusura Ticket
  // ─────────────────────────────────────────────
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "ticket_close") return;

    const channel = interaction.channel;
    const ticket = await Ticket.findOne({ channelId: channel.id, status: "open" });

    if (!ticket)
      return interaction.reply({ content: "❌ Questo ticket risulta già chiuso.", ephemeral: true });

    ticket.status = "closed";
    await ticket.save();

    ACTIVE_TICKETS.delete(channel.id);
    saveTickets();

    await interaction.reply("🔒 Ticket chiuso. Il canale verrà eliminato tra 5 secondi...");
    setTimeout(() => channel.delete().catch(() => {}), 5000);
  });

  // ─────────────────────────────────────────────
  // 🧹 Auto-rimozione se ticket viene cancellato manualmente
  // ─────────────────────────────────────────────
  client.on("channelDelete", async (channel) => {
    if (ACTIVE_TICKETS.has(channel.id)) {
      ACTIVE_TICKETS.delete(channel.id);
      saveTickets();
      await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed" });
      console.log(`🧹 Ticket eliminato manualmente → Rimosso dal registro (${channel.name})`);
    }
  });
}


