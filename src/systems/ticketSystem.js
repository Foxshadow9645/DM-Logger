import { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import Ticket from "../core/models/Ticket.js";

// ID Canale Log Staff (dove arrivano le notifiche)
const STAFF_LOG_CHANNEL = "1435285738185953390"; 

// ─────────────────────────────────────────────
// 👑 CONFIGURAZIONE RUOLI
// ─────────────────────────────────────────────
const ROLES = {
  // ALTO COMANDO (Vedono tutto o quasi)
  HOLDER: "1413141862906331176",
  FOUNDER: "1429034156326912124",
  CEO: "1429034157467635802",
  EXECUTIVE: "1429034166229663826",
  DIRECTOR: "1429034167781294080",

  // RUOLO SPECIFICO PARTNERSHIP (Quello che mi hai dato)
  PARTNERSHIP: "1434591845370957875",

  // ASSISTENZA
  HELPER: "1429034179747778560",
  TRIAL_HELPER: "1431283077824512112",
  MOD: "1429034178766180444"
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
        // Chi deve essere taggato e chi può vedere il canale
        rolesToPing: [ROLES.HOLDER, ROLES.FOUNDER, ROLES.CEO, ROLES.EXECUTIVE, ROLES.DIRECTOR]
      },
      "ticket_partnership": { 
        label: "Partnership", 
        color: "#3b82f6",
        description: "Proposta di affiliazione o collaborazione.",
        // Taggiamo il RUOLO PARTNERSHIP specifico + Director/Executive
        rolesToPing: [ROLES.PARTNERSHIP, ROLES.DIRECTOR, ROLES.EXECUTIVE]
      },
      "ticket_assistenza": { 
        label: "Assistenza", 
        color: "#6b7280",
        description: "Supporto generale per gli utenti.",
        // Assistenza gestita da Helper e Mod
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
    // Di base: nega a tutti, consenti all'utente
    const permissionOverwrites = [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
    ];

    // Aggiungi i permessi per i ruoli competenti (quelli definiti in rolesToPing)
    type.rolesToPing.forEach(roleId => {
      permissionOverwrites.push({
        id: roleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      });
    });

    // Assicura che Founder e Holder vedano sempre tutto (opzionale, ma consigliato)
    if (!type.rolesToPing.includes(ROLES.FOUNDER)) {
        permissionOverwrites.push({ id: ROLES.FOUNDER, allow: [PermissionFlagsBits.ViewChannel] });
    }
    if (!type.rolesToPing.includes(ROLES.HOLDER)) {
        permissionOverwrites.push({ id: ROLES.HOLDER, allow: [PermissionFlagsBits.ViewChannel] });
    }

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

    // ─────────────────────────────────────────────
    // 📨 MESSAGGI NEL TICKET
    // ─────────────────────────────────────────────
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
        `ℹ️ **Info:** ${type.description}\n` +
        `• Descrivi la tua richiesta in modo chiaro.\n` +
        `• Se l’operatore interviene, rimango in silenzio.\n\n` +
        `⏱️ Attendere l'assegnazione da parte dello Staff.`
      );

    await channel.send({ content: `<@${user.id}>`, embeds: [welcomeEmbed], components: [buttons] });

    // ─────────────────────────────────────────────
    // 🔔 LOG E NOTIFICA STAFF (IL PUNTO CRUCIALE)
    // ─────────────────────────────────────────────
    const staffChannel = guild.channels.cache.get(STAFF_LOG_CHANNEL);
    if (staffChannel) {
        
        // Creiamo la stringa con i tag (es. @Partnership @Director)
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
            `Premi **Reclama Ticket** per prendere in carico.`
          )
          .setFooter({ text: "Notifica inviata ai ruoli competenti" });

        // Inviamo il messaggio taggando i ruoli fuori dall'embed (così suona la notifica)
        await staffChannel.send({ 
            content: `🚨 **Nuovo Ticket!** ${mentions}`, 
            embeds: [staffEmbed], 
            components: [claimRow] 
        });
    }

    await interaction.reply({ content: `✅ Ticket creato: <#${channel.id}>`, ephemeral: true });
  });
}
