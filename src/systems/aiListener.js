import { getSmartReply } from "../ai/geminiHandler.js";
import Ticket from "../core/models/Ticket.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

// ID dell'umano da notificare
const HUMAN_STAFF_ID = "1197583344356053083";

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    // Ignora bot e messaggi fuori dai server
    if (message.author.bot || !message.guild) return;
    
    // Controlla se siamo in un canale ticket
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    // Recupera info ticket dal DB
    const ticket = await Ticket.findOne({ channelId: channel.id });
    
    // Se il ticket non esiste o è GIA' reclamato da uno staffer, l'IA deve stare zitta
    if (!ticket || ticket.claimed) return;

    const content = message.content.trim();
    // Ignora messaggi vuoti o comandi e messaggi di chiusura
    if (!content || content.startsWith("/") || content.startsWith("!")) return;
    if (content.toLowerCase().includes("chiudi")) return; // Lascia gestire la chiusura all'altro sistema

    await channel.sendTyping();

    // Invoca Gemini Handler
    const contextInfo = `Utente: ${message.author.tag} | Ticket Tipo: ${ticket.type}`;
    const reply = await getSmartReply(message.author.id, content, contextInfo);

    // ─────────────────────────────────────────────
    // 🚨 RILEVAMENTO CHIAMATA STAFF (TRIGGER)
    // ─────────────────────────────────────────────
    if (reply.includes("TRIGGER_STAFF_CALL")) {
        // 1. Notifica l'umano specifico
        const notificationMsg = `🚨 **Richiesta intervento umano!**\nAttenzione <@${HUMAN_STAFF_ID}>, l'utente richiede assistenza diretta.`;

        // 2. Crea il Tasto Rosso per reclamare (usa lo stesso ID gestito da staffClaim.js)
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`claim_${channel.id}`) // Questo ID attiva la logica in staffClaim.js
                .setLabel("👮‍♂️ PRENDI IN CARICO (Staff)")
                .setStyle(ButtonStyle.Danger) // ROSSO
        );

        await message.reply({ 
            content: notificationMsg, 
            components: [row] 
        });

        // L'IA esce di scena (non invia altro testo)
        return;
    }

    // ─────────────────────────────────────────────
    // 💬 RISPOSTA NORMALE (Umana)
    // ─────────────────────────────────────────────
    await message.reply({
      content: reply // Inviamo come testo normale per sembrare più umani, niente embed
    });
  });
}
