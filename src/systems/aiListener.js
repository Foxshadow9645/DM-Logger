import { getSmartReply } from "../ai/groqHandler.js"; 
import Ticket from "../core/models/Ticket.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

// ID del canale dove notificare lo staff (preso dal tuo file originale)
const STAFF_ALERT_CHANNEL_ID = "1430240657179541575";

// 🛡️ LISTA RUOLI STAFF (L'IA deve ignorare chi ha questi ruoli)
const STAFF_ROLES = [
  "1429034166229663826","1429034167781294080","1429034175171792988",
  "1429034176014843944","1429034177000509451","1429034177898086491",
  "1429034178766180444","1429034179747778560","1431283077824512112"
];

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    // 1. Controlli base
    if (message.author.bot || !message.guild) return;

    // 2. 🛑 BLOCCA LO STAFF (Lo staff non triggera l'AI)
    if (message.member && message.member.roles.cache.some(r => STAFF_ROLES.includes(r.id))) return;
    
    // 3. Verifica canale ticket
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    // 4. Se l'utente usa comandi manuali di chiusura, ignora l'AI (gestito da ticketClose.js)
    if (message.content.toLowerCase() === "chiudi ticket") return;

    // 5. Recupera Ticket DB
    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket || ticket.claimed) return; // Se già reclamato, silenzio.

    const content = message.content.trim();
    if (!content || content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // 6. Genera risposta AI
    // Passiamo un contesto vuoto o personalizzato se serve
    const contextInfo = `Utente: ${message.author.username} | Ticket ID: ${ticket.ticketId}`;
    let reply = await getSmartReply(message.author.id, content, contextInfo);

    // ─────────────────────────────────────────────
    // 🔒 GESTIONE CHIUSURA AUTOMATICA (Fix richiesto)
    // ─────────────────────────────────────────────
    if (reply.includes("TRIGGER_TICKET_CLOSE")) {
        // Rimuoviamo il trigger dal messaggio visibile
        const cleanReply = reply.replace("TRIGGER_TICKET_CLOSE", "").trim();
        
        await message.reply(cleanReply || "Ricevuto. Chiusura ticket in corso...");

        // Logica di chiusura
        await Ticket.findOneAndUpdate(
            { channelId: channel.id },
            { status: "closed", staffId: null, claimed: false }
        );

        // Timer di 5 secondi
        setTimeout(async () => {
             await channel.delete().catch(() => {});
        }, 5000);
        
        return; // Stop esecuzione
    }

    // ─────────────────────────────────────────────
    // 🚨 RILEVAMENTO CHIAMATA STAFF
    // ─────────────────────────────────────────────
    if (reply.includes("TRIGGER_STAFF_CALL")) {
        
        const splitReply = reply.split("TRIGGER_STAFF_CALL:");
        const problemSummary = splitReply[1] ? splitReply[1].trim() : "L'utente richiede assistenza generica o Partnership.";
        
        // Puliamo la risposta per l'utente (togliamo il trigger e il riassunto tecnico)
        const userReply = splitReply[0].trim() || "Ho inoltrato la richiesta allo staff.";

        await message.reply(userReply);

        const alertChannel = client.channels.cache.get(STAFF_ALERT_CHANNEL_ID);

        if (alertChannel) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`claim_${channel.id}`)
                    .setLabel(`👮‍♂️ Reclama Ticket`)
                    .setStyle(ButtonStyle.Danger)
            );

            const alertEmbed = new EmbedBuilder()
                .setColor("#e74c3c")
                .setTitle("🚨 Richiesta Intervento Staff")
                .setDescription(`L'IA ha scalato il ticket allo staff umano.`)
                .addFields(
                    { name: "👤 Utente", value: `<@${message.author.id}>`, inline: true },
                    { name: "📍 Canale", value: `<#${channel.id}>`, inline: true },
                    { name: "⚠️ Motivo", value: `**${problemSummary}**` }
                )
                .setTimestamp();

            await alertChannel.send({
                content: `<@&1429034166229663826>`, // Ping ruolo
                embeds: [alertEmbed],
                components: [row]
            });
        }
        return; 
    }

    // Risposta normale
    await message.reply({ content: reply });
  });
}
