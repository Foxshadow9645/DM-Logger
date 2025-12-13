import { getSmartReply } from "../ai/groqHandler.js"; 
import Ticket from "../core/models/Ticket.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

// 🟢 CANALE ALERT STAFF (Quello richiesto da te)
const STAFF_ALERT_CHANNEL_ID = "1435294808045256704"; 

// ─────────────────────────────────────────────
// 👑 CONFIGURAZIONE RUOLI PER I TAG
// ─────────────────────────────────────────────
const ROLES = {
  // SPECIALI
  PARTNERSHIP: "1434591845370957875", // ⚠️ Obbligatorio per ticket Partnership

  // ALTO COMANDO
  HOLDER: "1413141862906331176",
  FOUNDER: "1429034156326912124",
  CEO: "1429034157467635802",
  EXECUTIVE: "1429034166229663826",
  DIRECTOR: "1429034167781294080",

  // AMMINISTRAZIONE
  HEAD_ADMIN: "1429034175171792988",
  ADMIN: "1429034176014843944",

  // MODERAZIONE
  HEAD_MOD: "1429034177898086491",
  MOD: "1429034178766180444",

  // SUPPORTO
  HELPER: "1429034179747778560",
  TRIAL_HELPER: "1431283077824512112"
};

// Lista staff per ignorare i loro messaggi (L'IA non risponde allo staff)
const STAFF_ROLES_IDS = Object.values(ROLES);

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    // 1. Controlli di sicurezza
    if (message.author.bot || !message.guild) return;
    
    // 🛑 L'IA ignora i messaggi dello staff
    if (message.member && message.member.roles.cache.some(r => STAFF_ROLES_IDS.includes(r.id))) return;
    
    const channel = message.channel;
    // Agisce solo nei canali ticket
    if (!channel.name.startsWith("ticket-")) return;

    // Recupera ticket dal DB
    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket) return;

    // Se ticket reclamato, IA muta (risponde solo se taggata)
    const isTagged = message.mentions.has(client.user);
    if (ticket.claimed === true && !isTagged) return;

    const content = message.content.trim().toLowerCase();

    // 2. Comandi Manuali (Chiusura)
    if (isTagged && (content.includes("chiudi") || content.includes("close") || content.includes("fine"))) {
        await message.reply("Ricevuto. Procedo alla chiusura.");
        await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed", staffId: null, claimed: false });
        setTimeout(() => channel.delete().catch(() => {}), 5000);
        return; 
    }

    // Ignora comandi bot
    if (content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // ─────────────────────────────────────────────
    // 3. IA GENERATION
    // ─────────────────────────────────────────────
    const contextInfo = `
    DATI TECNICI:
    - Utente: ${message.author.username}
    - Categoria Ticket: ${ticket.type}
    `;

    let reply = await getSmartReply(message.author.id, message.content, contextInfo);
    
    // Pulizia output
    reply = reply.replace(/\[CONTESTO.*?\]/g, "").replace(/DATI TECNICI.*?/g, "").trim();

    // A. TRIGGER CHIUSURA
    if (reply.includes("TRIGGER_TICKET_CLOSE")) {
        const cleanMsg = reply.replace("TRIGGER_TICKET_CLOSE", "").trim();
        await message.reply(cleanMsg || "Chiudo il ticket come richiesto.");
        await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed" });
        setTimeout(() => channel.delete().catch(() => {}), 5000);
        return;
    }

    // B. TRIGGER STAFF CALL (La parte importante)
    if (reply.includes("TRIGGER_STAFF_CALL")) {
        const parts = reply.split("TRIGGER_STAFF_CALL:");
        const userMsg = parts[0].trim() || "Inoltro la richiesta allo staff competente.";
        const staffReason = parts[1] ? parts[1].trim().toLowerCase() : "Richiesta generica operatore.";

        await message.reply(userMsg);

        // ─────────────────────────────────────────────
        // 🧠 LOGICA DI TAGGING INTELLIGENTE
        // ─────────────────────────────────────────────
        let rolesToPing = [];

        // 1. REGOLE OBBLIGATORIE PER TIPO DI TICKET
        if (ticket.type && ticket.type.toLowerCase().includes("partnership")) {
            // ⚠️ PARTNERSHIP: Tagga SEMPRE il ruolo specifico
            rolesToPing.push(ROLES.PARTNERSHIP);
            rolesToPing.push(ROLES.DIRECTOR); // Opzionale: tagga anche i boss
        } else if (ticket.type && ticket.type.toLowerCase().includes("high")) {
            // HIGH STAFF: Tagga Alto Comando
            rolesToPing.push(ROLES.FOUNDER, ROLES.CEO, ROLES.EXECUTIVE);
        } else {
            // ASSISTENZA/ALTRO: Tagga Helper base
            rolesToPing.push(ROLES.HELPER, ROLES.TRIAL_HELPER);
        }

        // 2. ANALISI DELLA RICHIESTA UTENTE (Override Intelligente)
        // Se l'utente ha chiesto esplicitamente un ruolo nel messaggio, lo aggiungiamo
        if (staffReason.includes("founder") || staffReason.includes("fondatore")) rolesToPing.push(ROLES.FOUNDER);
        if (staffReason.includes("ceo")) rolesToPing.push(ROLES.CEO);
        if (staffReason.includes("admin")) rolesToPing.push(ROLES.ADMIN, ROLES.HEAD_ADMIN);
        if (staffReason.includes("mod")) rolesToPing.push(ROLES.MOD, ROLES.HEAD_MOD);

        // Rimuove duplicati
        rolesToPing = [...new Set(rolesToPing)];

        // Costruisce la stringa di menzione
        const mentions = rolesToPing.map(id => `<@&${id}>`).join(" ");

        // ─────────────────────────────────────────────
        // 📨 INVIO ALERT AL CANALE SPECIFICO
        // ─────────────────────────────────────────────
        const alertChannel = client.channels.cache.get(STAFF_ALERT_CHANNEL_ID);
        if (alertChannel) {
             const alertEmbed = new EmbedBuilder()
                .setColor("#e74c3c") // Rosso urgente
                .setTitle("🚨 L'IA richiede intervento Staff")
                .setDescription(`L'intelligenza artificiale non può gestire questa richiesta e ha chiamato un umano.`)
                .addFields(
                    { name: "Ticket", value: `<#${channel.id}>`, inline: true },
                    { name: "Utente", value: `<@${message.author.id}>`, inline: true },
                    { name: "Categoria", value: ticket.type || "N/A", inline: true },
                    { name: "Motivo Chiamata", value: staffReason, inline: false }
                )
                .setTimestamp();
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`claim_${channel.id}`).setLabel("🟢 Reclama Ora").setStyle(ButtonStyle.Success)
            );

            // Invia il messaggio con i TAG fuori dall'embed per far suonare la notifica
            await alertChannel.send({ 
                content: `🔔 **Richiesta Supporto:** ${mentions}`, 
                embeds: [alertEmbed], 
                components: [row] 
            });
        }
        return;
    }

    // C. RISPOSTA STANDARD
    await message.reply(reply);
  });
}
