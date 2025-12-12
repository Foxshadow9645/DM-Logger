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

    if (message.content.toLowerCase() === "chiudi ticket") return;

    // Recupera Ticket DB
    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket || ticket.claimed) return; 

    const content = message.content.trim();
    if (!content || content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // ─────────────────────────────────────────────
    // 🧠 COSTRUZIONE CONTESTO (METADATA)
    // ─────────────────────────────────────────────
    // Usiamo un formato esplicito che il Ruleset riconoscerà come "DA NON LEGGERE"
    const contextInfo = `
    [[SYSTEM_METADATA_DO_NOT_REPEAT]]
    - USER_ID_TAG: <@${message.author.id}>
    - TICKET_CATEGORY: ${ticket.type.toUpperCase()}
    - GOAL: L'utente ha GIA' scelto la categoria ${ticket.type}. Non chiederla. Chiedi conferma e procedi.
    [[END_METADATA]]
    `;

    let reply = await getSmartReply(message.author.id, content, contextInfo);

    // 🛡️ FILTRO DI SICUREZZA: Rimuove eventuali "Info Sistema" se l'AI impazzisce e le ripete
    reply = reply.replace(/\[\[.*?\]\]/gs, "").replace(/\[Info Sistema.*?\]/gs, "").trim();

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
        const userReply = splitReply[0].trim() || "Inoltro subito la richiesta allo staff.";

        await message.reply(userReply);

        const alertChannel = client.channels.cache.get(STAFF_ALERT_CHANNEL_ID);
        if (alertChannel) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`claim_${channel.id}`).setLabel(`👮‍♂️ Reclama Ticket`).setStyle(ButtonStyle.Danger)
            );

            const alertEmbed = new EmbedBuilder()
                .setColor("#e74c3c")
                .setTitle("🚨 Richiesta Intervento Staff")
                .setDescription(`L'IA ha scalato il ticket.`)
                .addFields(
                    { name: "👤 Utente", value: `<@${message.author.id}>`, inline: true }, // Qui usiamo il TAG reale
                    { name: "📍 Categoria", value: `**${ticket.type}**`, inline: true },
                    { name: "⚠️ Problema", value: `${problemSummary}` }
                )
                .setTimestamp();

            await alertChannel.send({ content: `<@&1429034166229663826>`, embeds: [alertEmbed], components: [row] });
        }
        return; 
    }

    await message.reply({ content: reply });
  });
}
