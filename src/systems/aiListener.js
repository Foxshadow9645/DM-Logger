import { getSmartReply } from "../ai/groqHandler.js"; 
import Ticket from "../core/models/Ticket.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

const STAFF_ALERT_CHANNEL_ID = "1430240657179541575"; // Canale avvisi staff
// RUOLI STAFF (Ignorati dall'IA)
const STAFF_ROLES = [
  "1429034166229663826","1429034167781294080","1429034175171792988",
  "1429034176014843944","1429034177000509451","1429034177898086491",
  "1429034178766180444","1429034179747778560","1431283077824512112"
];

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    // 1. Controlli Preliminari
    if (message.author.bot || !message.guild) return;
    
    // Se scrive uno staff, l'IA non risponde mai
    if (message.member && message.member.roles.cache.some(r => STAFF_ROLES.includes(r.id))) return;
    
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    // Recupera lo stato del Ticket dal DB
    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket) return;

    const content = message.content.trim().toLowerCase();
    const isTagged = message.mentions.has(client.user);

    // ─────────────────────────────────────────────
    // 2. ECCEZIONE: CHIUSURA MANUALE (Funziona SEMPRE)
    // ─────────────────────────────────────────────
    // Se l'utente TAGGA il bot E dice "chiudi", il bot obbedisce anche se c'è lo staff
    if (isTagged && (content.includes("chiudi") || content.includes("close") || content.includes("fine"))) {
        await message.reply("Ricevuto. Procedo alla chiusura del ticket.");
        await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed", staffId: null, claimed: false });
        setTimeout(() => channel.delete().catch(() => {}), 5000);
        return; 
    }

    // ─────────────────────────────────────────────
    // 3. SILENZIO RADIO (Se claimed = true, STOP)
    // ─────────────────────────────────────────────
    // Se un umano ha preso in carico il ticket, l'IA DEVE stare zitta.
    // Risponde SOLO se viene taggata (gestito sopra)
    if (ticket.claimed === true) return; 

    // Ignora comandi che iniziano con prefix (! o /)
    if (content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // ─────────────────────────────────────────────
    // 4. GENERAZIONE RISPOSTA AI (Solo se NON reclamato)
    // ─────────────────────────────────────────────
    
    // Info per l'IA (Non visibili all'utente)
    const contextInfo = `
    DATI TECNICI:
    - Utente: ${message.author.username} (ID: ${message.author.id})
    - Categoria: ${ticket.type}
    `;

    // Chiede risposta a Groq
    let reply = await getSmartReply(message.author.id, message.content, contextInfo);

    // Pulizia output (rimuove eventuali meta-tag rimasti)
    reply = reply.replace(/\[CONTESTO.*?\]/g, "").replace(/DATI TECNICI.*?/g, "").trim();

    // A. Gestione Trigger Chiusura da AI
    if (reply.includes("TRIGGER_TICKET_CLOSE")) {
        const cleanReply = reply.replace("TRIGGER_TICKET_CLOSE", "").trim();
        await message.reply(cleanReply || "Arrivederci.");
        await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed", staffId: null, claimed: false });
        setTimeout(() => channel.delete().catch(() => {}), 5000);
        return;
    }

    // B. Gestione Trigger Chiamata Staff
    if (reply.includes("TRIGGER_STAFF_CALL")) {
        const parts = reply.split("TRIGGER_STAFF_CALL:");
        const userMsg = parts[0].trim() || "Inoltro la richiesta allo staff.";
        const staffMsg = parts[1] ? parts[1].trim() : "Richiesta operatore.";

        await message.reply(userMsg);

        // Manda alert nel canale staff
        const alertChannel = client.channels.cache.get(STAFF_ALERT_CHANNEL_ID);
        if (alertChannel) {
             const alertEmbed = new EmbedBuilder()
                .setColor("#e74c3c")
                .setTitle("🚨 Richiesta Staff")
                .addFields(
                    { name: "Ticket", value: `<#${channel.id}>`, inline: true },
                    { name: "Utente", value: `<@${message.author.id}>`, inline: true },
                    { name: "Motivo", value: staffMsg }
                )
                .setTimestamp();
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`claim_${channel.id}`).setLabel("Reclama").setStyle(ButtonStyle.Danger)
            );

            await alertChannel.send({ embeds: [alertEmbed], components: [row] });
        }
        return;
    }

    // C. Risposta Standard
    await message.reply(reply);
  });
}
