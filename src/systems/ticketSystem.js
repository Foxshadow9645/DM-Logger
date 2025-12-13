import { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import Ticket from "../core/models/Ticket.js";

// 🟢 CANALE LOG STAFF (ID Corretto da te indicato)
const STAFF_LOG_CHANNEL = "1435285738185953390"; 

// ─────────────────────────────────────────────
// 👑 CONFIGURAZIONE RUOLI
// ─────────────────────────────────────────────
const ROLES = {
  // ALTO COMANDO
  HOLDER: "1413141862906331176",
  FOUNDER: "1429034156326912124",
  CEO: "1429034157467635802",
  EXECUTIVE: "1429034166229663826",
  DIRECTOR: "1429034167781294080",

  // RUOLO PARTNERSHIP
  PARTNERSHIP: "1434591845370957875",

  // ASSISTENZA & STAFF GENERICO
  HELPER: "1429034179747778560",
  TRIAL_HELPER: "1431283077824512112",
  MOD: "1429034178766180444",
  HEAD_MOD: "1429034177898086491",
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
        // Ruoli da taggare e aggiungere al canale
        rolesToPing: [ROLES.HOLDER, ROLES.FOUNDER, ROLES.CEO, ROLES.EXECUTIVE, ROLES.DIRECTOR]
      },
      "ticket_partnership": { 
        label: "Partnership", 
        color: "#3b82f6",
        description: "Proposta di affiliazione o collaborazione.",
        // ⚠️ TAG OBBLIGATORIO: Ruolo Partnership + Alto Comando
        rolesToPing: [ROLES.PARTNERSHIP, ROLES.DIRECTOR, ROLES.EXECUTIVE, ROLES.CEO, ROLES.FOUNDER]
      },
      "ticket_assistenza": { 
        label: "Assistenza", 
        color: "#6b7280",
        description: "Supporto generale per gli utenti.",
        // Helper, Trial Helper e Mod
        rolesToPing: [ROLES.HELPER, ROLES.TRIAL_HELPER, ROLES.MOD]
      }
    };

    const type = ticketTypes[interaction.customId];
    if (!type) return;

    const user = interaction.user;
    const guild = interaction.guild;

    // Controllo ticket già aperto
    const existing = await Ticket.findOne({ userId: user.id, status: "open" });
    if (existing) {
      return interaction.reply({ content: "⚠️ Hai già un ticket aperto.", ephemeral: true });
    }

    // ─────────────────────────────────────────────
    // 🔒 GESTIONE PERMESSI CANALE
    // ─────────────────────────────────────────────
    const permissionOverwrites = [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ];

    // Aggiunge i permessi per i ruoli specifici del ticket
    type.rolesToPing.forEach(roleId => {
      permissionOverwrites.push({
        id: roleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      });
    });

    // Founder e Holder vedono sempre tutto (sicurezza)
    if (!type.rolesToPing.includes(ROLES.FOUNDER)) 
        permissionOverwrites.push({ id: ROLES.FOUNDER, allow: [PermissionFlagsBits.ViewChannel] });
    if (!type.rolesToPing.includes(ROLES.HOLDER)) 
        permissionOverwrites.push({ id: ROLES.HOLDER, allow: [PermissionFlagsBits.ViewChannel] });

    // Creazione Canale
    const channel = await guild.channels.create({
      name: `ticket-${user.username}`,
      type: ChannelType.GuildText,
      topic: `${type.label} — Aperto da ${user.tag}`,
      permissionOverwrites: permissionOverwrites
    });

    // Salvataggio DB
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

    // Messaggio Benvenuto
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_add_user").setLabel("➕ Aggiungi Utente").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Chiudi Ticket").setStyle(ButtonStyle.Danger)
    );

    const welcomeEmbed = new EmbedBuilder()
      .setColor(type.color)
      .setTitle(`🎟️ Ticket — ${type.label}`)
      .setDescription(
        `Salve <@${user.id}>.\n` +
        `Sono **DM Alpha**, assistenza automatica.\n\n` +
        `ℹ️ **Info:** ${type.description}\n` +
        `⏱️ Attendere l'assegnazione da parte dello Staff.`
      );

    await channel.send({ content: `<@${user.id}>`, embeds: [welcomeEmbed], components: [buttons] });

    // ─────────────────────────────────────────────
    // 🔔 NOTIFICA STAFF (Con Tag Corretti)
    // ─────────────────────────────────────────────
    const staffChannel = guild.channels.cache.get(STAFF_LOG_CHANNEL);
    if (staffChannel) {
        
        // Genera la stringa di menzioni (es. <@&ID_PARTNERSHIP> <@&ID_DIRECTOR> ...)
        const mentions = type.rolesToPing.map(r => `<@&${r}>`).join(" ");

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
            `Premi il pulsante per prendere in carico.`
          )
          .setFooter({ text: "DM REALM ALPHA • Ticket System" });

        // Invia messaggio con TAG FUORI dall'embed per far suonare la notifica
        await staffChannel.send({ 
            content: `🚨 **Nuovo Ticket!** ${mentions}`, 
            embeds: [staffEmbed], 
            components: [claimRow] 
        });
    }

    await interaction.reply({ content: `✅ Ticket creato: <#${channel.id}>`, ephemeral: true });
  });
}
