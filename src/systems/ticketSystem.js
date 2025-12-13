import { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import Ticket from "../core/models/Ticket.js";

// 🟢 CANALE TICKET LOG (Dove finiscono i ticket appena aperti)
const TICKET_LOG_CHANNEL = "1435285738185953390"; 

// ─────────────────────────────────────────────
// 👑 CONFIGURAZIONE RUOLI
// ─────────────────────────────────────────────
const ROLES = {
  HOLDER: "1413141862906331176",
  FOUNDER: "1429034156326912124",
  CEO: "1429034157467635802",
  EXECUTIVE: "1429034166229663826",
  DIRECTOR: "1429034167781294080",
  PARTNERSHIP: "1434591845370957875",
  HELPER: "1429034179747778560",
  TRIAL_HELPER: "1431283077824512112",
  MOD: "1429034178766180444",
  ADMIN: "1429034176014843944"
};

export default function ticketSystem(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    // Configurazione Tipi di Ticket
    const ticketTypes = {
      "ticket_highstaff": { 
        label: "High Staff", 
        color: "#dc2626",
        description: "Richiesta riservata all'Alto Comando.",
        rolesToPing: [ROLES.HOLDER, ROLES.FOUNDER, ROLES.CEO, ROLES.EXECUTIVE, ROLES.DIRECTOR]
      },
      "ticket_partnership": { 
        label: "Partnership", 
        color: "#3b82f6",
        description: "Proposta di affiliazione.",
        // ⚠️ Nel log di apertura tagghiamo il manager.
        rolesToPing: [ROLES.PARTNERSHIP]
      },
      "ticket_assistenza": { 
        label: "Assistenza", 
        color: "#6b7280",
        description: "Supporto generale per gli utenti.",
        rolesToPing: [ROLES.HELPER, ROLES.TRIAL_HELPER, ROLES.MOD]
      }
    };

    const type = ticketTypes[interaction.customId];
    if (!type) return;

    const user = interaction.user;
    const guild = interaction.guild;

    const existing = await Ticket.findOne({ userId: user.id, status: "open" });
    if (existing) {
      return interaction.reply({ content: "⚠️ Hai già un ticket aperto.", ephemeral: true });
    }

    // ─────────────────────────────────────────────
    // 🔒 PERMESSI CANALE
    // ─────────────────────────────────────────────
    const permissionOverwrites = [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ];

    type.rolesToPing.forEach(roleId => {
      permissionOverwrites.push({
        id: roleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      });
    });

    // Founder e Holder vedono sempre tutto
    if (!type.rolesToPing.includes(ROLES.FOUNDER)) permissionOverwrites.push({ id: ROLES.FOUNDER, allow: [PermissionFlagsBits.ViewChannel] });
    if (!type.rolesToPing.includes(ROLES.HOLDER)) permissionOverwrites.push({ id: ROLES.HOLDER, allow: [PermissionFlagsBits.ViewChannel] });

    // Creazione Canale
    const channel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      topic: `${type.label} — Aperto da ${user.tag}`,
      permissionOverwrites: permissionOverwrites
    });

    await Ticket.create({
      ticketId: channel.id,
      channelId: channel.id,
      userId: user.id,
      claimed: false,
      staffId: null,
      status: "open",
      type: type.label,
      createdAt: new Date()
    });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_add_user").setLabel("➕ Aggiungi Utente").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Chiudi Ticket").setStyle(ButtonStyle.Danger)
    );

    const welcomeEmbed = new EmbedBuilder()
      .setColor(type.color)
      .setTitle(`🎟️ Ticket — ${type.label}`)
      .setDescription(
        `Salve <@${user.id}>.\n` +
        `Sono **DM Alpha**.\n\n` +
        `ℹ️ **Info:** ${type.description}\n` +
        `⏱️ Attendere l'assegnazione da parte dello Staff.`
      );

    await channel.send({ content: `<@${user.id}>`, embeds: [welcomeEmbed], components: [buttons] });

    // ─────────────────────────────────────────────
    // 🔔 LOG APERTURA (In Ticket Log)
    // ─────────────────────────────────────────────
    const logChannel = guild.channels.cache.get(TICKET_LOG_CHANNEL);
    if (logChannel) {
        const mentions = type.rolesToPing.map(r => `<@&${r}>`).join(" ");

        const claimRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`claim_${channel.id}`).setLabel("🟢 Reclama Ticket").setStyle(ButtonStyle.Success)
        );

        const logEmbed = new EmbedBuilder()
          .setColor("#22c55e")
          .setTitle("🟢 Nuovo Ticket Aperto")
          .setDescription(
            `**Tipo:** ${type.label}\n` +
            `**Utente:** <@${user.id}>\n` +
            `**Canale:** <#${channel.id}>`
          )
          .setFooter({ text: "Log Apertura Ticket" });

        await logChannel.send({ 
            content: `🚨 **Nuovo Ticket!** ${mentions}`, 
            embeds: [logEmbed], 
            components: [claimRow] 
        });
    }

    await interaction.reply({ content: `✅ Ticket creato: <#${channel.id}>`, ephemeral: true });
  });
}
