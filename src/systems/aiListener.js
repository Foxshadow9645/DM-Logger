import { getSmartReply } from "../ai/groqHandler.js"; 
import Ticket from "../core/models/Ticket.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

const STAFF_ALERT_CHANNEL_ID = "1430240657179541575";

const STAFF_ROLES = [
  "1429034166229663826","1429034167781294080","1429034175171792988",
  "1429034176014843944","1429034177000509451","1429034177898086491",
  "1429034178766180444","1429034179747778560","1431283077824512112"
];

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    // 1. Controlli base
    if (message.author.bot || !message.guild) return;
    if (message.member && message.member.roles.cache.some(r => STAFF_ROLES.includes(r.id))) return;
    
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    // Recupera Ticket DB
    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket) return;

    const content = message.content.trim().toLowerCase();
    
    // ─────────────────────────────────────────────
    // 1. PRIORITÀ ASSOLUTA: COMANDO CHIUSURA (Funziona anche se CLAIMED)
    // ─────────────────────────────────────────────
    // Se l'utente TAGGA il bot E dice "chiudi" (o simili)
    if (message.mentions.has(client.user) && (content.includes("chiudi") || content.includes("close") || content.includes("fine"))) {
        await message.reply("Ricevuto. Procedo alla chiusura del ticket.");
        await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed", staffId: null, claimed: false });
        setTimeout(() => channel.delete().catch(() => {}), 5000);
        return; // Stop esecuzione
    }

    // ─────────────────────────────────────────────
    // 2. CHECK SILENZIO RADIO (Se claimed, il bot tace)
    // ─────────────────────────────────────────────
    if (ticket.claimed) return; 

    // 3. Ignora comandi manuali (iniziano con ! o /)
    if (content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // ─────────────────────────────────────────────
    // 3. LOGICA AI (Solo se NON claimed e NON comando chiusura)
    // ─────────────────────────────────────────────
    
    const contextInfo = `
    DATI TECNICI (DA NON CITARE):
    - ID Utente: ${message.author.id}
    - Categoria Ticket: ${ticket.type.toUpperCase()}
    - Obiettivo: Assistere l'utente in base alla categoria.
    
    ISTRUZIONI:
    Se PARTNERSHIP -> Chiedi conferma e link server.
    Se ASSISTENZA -> Chiedi il problema.
    `;

    // Genera risposta
    let reply = await getSmartReply(message.author.id, message.content, contextInfo);

    // Filtro pulizia
    reply = reply.replace(/\[CONTESTO.*?\]/g, "").replace(/DATI TECNICI.*?/g, "").trim();

    // Gestione Trigger Chiusura generato da AI (senza tag)
    if (reply.includes("TRIGGER_TICKET_CLOSE")) {
        const cleanReply = reply.replace("TRIGGER_TICKET_CLOSE", "").trim();
        await message.reply(cleanReply || "Arrivederci.");
        await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed", staffId: null, claimed: false });
        setTimeout(() => channel.delete().catch(() => {}), 5000);
        return;
    }

    // Gestione Trigger Staff Call
    if (reply.includes("TRIGGER_STAFF_CALL")) {
        const parts = reply.split("TRIGGER_STAFF_CALL:");
        const userMsg = parts[0].trim() || "Inoltro la richiesta.";
        const staffMsg = parts[1] ? parts[1].trim() : "Richiesta generica.";

        await message.reply(userMsg);

        const alertChannel = client.channels.cache.get(STAFF_ALERT_CHANNEL_ID);
        if (alertChannel) {
             const alertEmbed = new EmbedBuilder()
                .setColor("#e74c3c")
                .setTitle("🚨 Richiesta Staff")
                .addFields(
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

    await message.reply(reply);
  });
}
