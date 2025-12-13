import { getSmartReply } from "../ai/groqHandler.js"; 
import Ticket from "../core/models/Ticket.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

// 🟢 CANALE ALERT (ID Corretto)
const STAFF_ALERT_CHANNEL_ID = "1435285738185953390"; 

// Ruoli che l'IA deve ignorare (tutto lo staff)
const STAFF_ROLES = [
  "1413141862906331176", // Holder
  "1429034156326912124", // Founder
  "1429034157467635802", // CEO
  "1429034166229663826", // Executive
  "1429034167781294080", // Director
  "1434591845370957875", // Partnership (Aggiunto!)
  "1429034175171792988", // Head Admin
  "1429034176014843944", // Admin
  "1429034177000509451", // Management Mod
  "1429034177898086491", // Head Mod
  "1429034178766180444", // Mod
  "1429034179747778560", // Helper
  "1431283077824512112"  // Trial Helper
];

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    // Controlli base
    if (message.author.bot || !message.guild) return;
    
    // 🛑 Se parla lo STAFF, l'IA sta zitta
    if (message.member && message.member.roles.cache.some(r => STAFF_ROLES.includes(r.id))) return;
    
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket) return;

    // Se il ticket è reclamato, l'IA sta zitta (a meno che non venga taggata)
    const isTagged = message.mentions.has(client.user);
    if (ticket.claimed === true && !isTagged) return;

    const content = message.content.trim().toLowerCase();

    // Eccezione: chiusura manuale taggando il bot
    if (isTagged && (content.includes("chiudi") || content.includes("close"))) {
        await message.reply("Ricevuto. Procedo alla chiusura.");
        await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed", staffId: null, claimed: false });
        setTimeout(() => channel.delete().catch(() => {}), 5000);
        return; 
    }

    if (content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // Generazione Risposta
    const contextInfo = `DATI TECNICI:\n- Utente: ${message.author.username}\n- Categoria: ${ticket.type}`;
    let reply = await getSmartReply(message.author.id, message.content, contextInfo);
    reply = reply.replace(/\[CONTESTO.*?\]/g, "").replace(/DATI TECNICI.*?/g, "").trim();

    // A. Trigger Chiusura
    if (reply.includes("TRIGGER_TICKET_CLOSE")) {
        await message.reply(reply.replace("TRIGGER_TICKET_CLOSE", "").trim() || "Chiudo il ticket.");
        await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed" });
        setTimeout(() => channel.delete().catch(() => {}), 5000);
        return;
    }

    // B. Trigger Staff Call (Usa il canale corretto)
    if (reply.includes("TRIGGER_STAFF_CALL")) {
        const parts = reply.split("TRIGGER_STAFF_CALL:");
        const userMsg = parts[0].trim() || "Chiamo un operatore umano.";
        const staffMsg = parts[1] ? parts[1].trim() : "L'IA richiede intervento.";

        await message.reply(userMsg);

        const alertChannel = client.channels.cache.get(STAFF_ALERT_CHANNEL_ID);
        if (alertChannel) {
             const alertEmbed = new EmbedBuilder()
                .setColor("#e74c3c")
                .setTitle("🚨 Richiesta Supporto Staff")
                .addFields(
                    { name: "Ticket", value: `<#${channel.id}>`, inline: true },
                    { name: "Utente", value: `<@${message.author.id}>`, inline: true },
                    { name: "Motivo IA", value: staffMsg }
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
