import { getSmartReply } from "../ai/geminiHandler.js";
import Ticket from "../core/models/Ticket.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

// ID del CANALE dove mandare la notifica staff
const STAFF_ALERT_CHANNEL_ID = "1430240657179541575";

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    // 1. Controlli base (no bot, deve essere in una guild)
    if (message.author.bot || !message.guild) return;
    
    // 2. Verifica se è un canale ticket
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    // 3. Verifica se l'utente vuole CHIUDERE (Priorità assoluta)
    // Se tagga il bot e dice "chiudi", l'IA non deve intromettersi, lascia fare a ticketClose.js
    if (message.mentions.has(client.user) && message.content.toLowerCase().includes("chiudi")) return;

    // 4. Recupera info ticket dal Database
    const ticket = await Ticket.findOne({ channelId: channel.id });
    
    // Se il ticket non esiste o è già reclamato da uno staffer, l'IA tace.
    if (!ticket || ticket.claimed) return;

    const content = message.content.trim();
    // Ignora comandi che iniziano con prefix
    if (!content || content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // 5. Chiede risposta all'IA
    const contextInfo = `Utente: ${message.author.tag} | Ticket Tipo: ${ticket.type}`;
    const reply = await getSmartReply(message.author.id, content, contextInfo);

    // ─────────────────────────────────────────────
    // 🚨 RILEVAMENTO RICHIESTA STAFF (TRIGGER)
    // ─────────────────────────────────────────────
    if (reply.includes("TRIGGER_STAFF_CALL")) {
        
        // Cerchiamo il canale specifico per le notifiche
        const alertChannel = client.channels.cache.get(STAFF_ALERT_CHANNEL_ID);

        if (alertChannel) {
            // Creiamo il bottone per reclamare
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`claim_${channel.id}`) // Collega a staffClaim.js
                    .setLabel(`👮‍♂️ Reclama Ticket di ${message.author.username}`)
                    .setStyle(ButtonStyle.Danger) // ROSSO
            );

            // Inviamo la notifica nel canale staff dedicato
            await alertChannel.send({
                content: `🚨 **RICHIESTA INTERVENTO UMANO**\nL'utente <@${message.author.id}> richiede assistenza nel ticket <#${channel.id}>.`,
                components: [row]
            });

            // Conferma discreta all'utente nel ticket
            await message.reply("Ho inoltrato la richiesta. Uno staffer arriverà a breve.");
        } else {
            console.error(`❌ Canale notifica staff non trovato: ${STAFF_ALERT_CHANNEL_ID}`);
            await message.reply("Errore nel contattare lo staff. Riprova più tardi.");
        }

        // L'IA smette di rispondere qui.
        return;
    }

    // ─────────────────────────────────────────────
    // 💬 RISPOSTA NORMALE (Umana)
    // ─────────────────────────────────────────────
    // Inviamo la risposta come testo semplice (no Embed, per sembrare umano)
    await message.reply({ content: reply });
  });
}
