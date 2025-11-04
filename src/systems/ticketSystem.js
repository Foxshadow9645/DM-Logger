import fs from "fs";
import path from "path";
import Ticket from "../core/models/Ticket.js";
import { generateTranscript } from "../core/transcript.js";
import { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const TICKETS_FILE = path.resolve("src/data/activeTickets.json");
const LOG_CHANNEL_ID = "1435294808045256704";

// Carica Ticket attivi + contatore
let ACTIVE_TICKETS = new Set();
let COUNTER = 1;
let STAFF_ENGAGED = new Set();

try {
  const data = JSON.parse(fs.readFileSync(TICKETS_FILE));
  ACTIVE_TICKETS = new Set(data.active || []);
  COUNTER = data.counter || 1;
} catch {}

// Salvataggio persistente
function saveTickets() {
  fs.writeFileSync(
    TICKETS_FILE,
    JSON.stringify({ active: [...ACTIVE_TICKETS], counter: COUNTER }, null, 2)
  );
}

export default function ticketSystem(client) {

  // ─────────────────────────────────────────────
  // 🎟️ CREAZIONE TICKET
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

    // Anti doppia apertura
    const openTicket = await Ticket.findOne({ userId: user.id, status: "open" });
    if (openTicket)
      return interaction.reply({ content: "⚠️ Hai già un ticket aperto.", ephemeral: true });

    // Numerazione progressiva
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

    // Pulsanti
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_claim").setLabel("🟢 Reclama Ticket").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Chiudi Ticket").setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setTitle(`🎟️ Ticket — ${type.label}`)
      .setDescription(
        `Salve <@${user.id}>.\n\n` +
        `Sono **DM Alpha**, assistente operativo.\n` +
        `Spiega il tuo problema in modo chiaro.\n` +
        `Un operatore ti assisterà appena possibile.\n\n` +
        `❗ *Comportamenti scorretti verranno registrati.*`
      )
      .setColor(type.color)
      .setTimestamp();

    await channel.send({ content: `<@${user.id}>`, embeds: [embed], components: [buttons] });

    await interaction.reply({ content: `✅ Ticket aperto: <#${channel.id}>`, ephemeral: true });
  });

  // ─────────────────────────────────────────────
  // 🟢 RECLAMO TICKET (STAFF)
  // ─────────────────────────────────────────────
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "ticket_claim") return;

    const channel = interaction.channel;
    const staffMember = interaction.member;

    const allowedStaffRoles = [
      "1429034166229663826","1429034167781294080","1429034175171792988","1429034176014843944",
      "1429034177000509451","1429034177898086491","1429034178766180444",
      "1429034179747778560","1431283077824512112","1429034157467635802"
    ];

    if (!allowedStaffRoles.some(id => staffMember.roles.cache.has(id)))
      return interaction.reply({ content: "❌ Solo lo staff può reclamare questo ticket.", ephemeral: true });

    await channel.permissionOverwrites.edit(staffMember.id, {
      ViewChannel: true, SendMessages: true, ReadMessageHistory: true
    });

    STAFF_ENGAGED.add(channel.id);

    await interaction.reply({ content: `🟢 Ticket preso in carico da <@${staffMember.id}>.` });
  });

  // ─────────────────────────────────────────────
  // 🔒 CHIUSURA + TRASCRIZIONE PDF
  // ─────────────────────────────────────────────
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "ticket_close") return;

    const channel = interaction.channel;

    await interaction.reply("🔄 Generazione trascrizione...");

    const pdfPath = await generateTranscript(channel);
    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

    if (logChannel) {
      await logChannel.send({
        content: `📑 **Trascrizione Ticket**\nTicket: <#${channel.id}>`,
        files: [pdfPath]
      });
    }

    ACTIVE_TICKETS.delete(channel.id);
    STAFF_ENGAGED.delete(channel.id);
    saveTickets();

    setTimeout(() => channel.delete().catch(() => {}), 3000);
  });

  // ─────────────────────────────────────────────
  // 🧹 AUTO-RIMOZIONE SE CANALE ELIMINATO MANUALMENTE
  // ─────────────────────────────────────────────
  client.on("channelDelete", async (channel) => {
    if (ACTIVE_TICKETS.has(channel.id)) {
      ACTIVE_TICKETS.delete(channel.id);
      STAFF_ENGAGED.delete(channel.id);
      saveTickets();
      console.log(`🧹 Ticket rimosso manualmente → Registro aggiornato (${channel.name})`);
    }
  });
}
