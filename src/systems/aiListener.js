import { getSmartReply } from "../ai/groqHandler.js"; 
import Ticket from "../core/models/Ticket.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

const STAFF_ALERT_CHANNEL_ID = "1430240657179541575"; // Canale Staff
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
    if (message.member && message.member.roles.cache.some(r => STAFF_ROLES.includes(r.id))) return;
    
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    // Gestione comandi manuali di chiusura
    if (message.content.toLowerCase() === "chiudi ticket") return;

    // Recupera Ticket DB
    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket || ticket.claimed) return; 

    const content = message.content.trim();
    if (!content || content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // ─────────────────────────────────────────────
    // 🧠 COSTRUZIONE CONTESTO AVANZATO
    // ─────────────────────────────────────────────
    // Passiamo all'AI il motivo per cui il ticket è stato aperto
    const contextInfo = `
    [DATI UTENTE]
    - Nome Discord: ${message.author.username}
    - ID Ufficiale: ${message.author.id} (Usa questo solo per i report allo staff)
    
    [STATO TICKET]
    - Categoria scelta dall'utente: ${ticket.type.toUpperCase()} (Es. Partnership, Assistenza, High Staff)
    - Obiettivo: L'utente ha cliccato il bottone relativo a questa categoria.
    `;

    let reply = await getSmartReply(message.author.id, content, contextInfo);

    // ─────────────────────────────────────────────
    // 🔒 CHIUSURA TICKET
    // ─────────────────────────────────────────────
    if (reply.includes("TRIGGER_TICKET_CLOSE")) {
        const cleanReply = reply.replace("TRIGGER_TICKET_CLOSE", "").trim();
        await message.reply(cleanReply || "Ricevuto. Chiusura ticket in corso...");
        
        await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed", staffId: null, claimed: false });
        setTimeout(async () => { await channel.delete().catch(() => {}); }, 5000);
        return;
    }

    // ─────────────────────────────────────────────
    // 🚨 CHIAMATA STAFF
    // ─────────────────────────────────────────────
    if (reply.includes("TRIGGER_STAFF_CALL")) {
        const splitReply = reply.split("TRIGGER_STAFF_CALL:");
        const problemSummary = splitReply[1] ? splitReply[1].trim() : "Richiesta intervento manuale.";
        const userReply = splitReply[0].trim() || "Inoltro la richiesta allo staff.";

        await message.reply(userReply);

        const alertChannel = client.channels.cache.get(STAFF_ALERT_CHANNEL_ID);
        if (alertChannel) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`claim_${channel.id}`).setLabel(`👮‍♂️ Reclama Ticket`).setStyle(ButtonStyle.Danger)
            );

            // QUI usiamo il TAG dell'utente (<@ID>) come richiesto, non il nome
            const alertEmbed = new EmbedBuilder()
                .setColor("#e74c3c")
                .setTitle("🚨 Richiesta Intervento Staff")
                .setDescription(`L'IA ha scalato il ticket allo staff umano.`)
                .addFields(
                    { name: "👤 Utente (Tag)", value: `<@${message.author.id}>`, inline: true }, // <--- TAG UFFICIALE
                    { name: "📍 Categoria", value: `**${ticket.type}**`, inline: true },
                    { name: "⚠️ Riepilogo IA", value: `${problemSummary}` }
                )
                .setTimestamp();

            await alertChannel.send({ content: `<@&1429034166229663826>`, embeds: [alertEmbed], components: [row] });
        }
        return; 
    }

    await message.reply({ content: reply });
  });
}
