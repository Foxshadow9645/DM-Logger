import { getSmartReply } from "../ai/groqHandler.js"; 
import Ticket from "../core/models/Ticket.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

// 🔴 CANALE TICKET ALERT (Richieste Operatore)
const TICKET_ALERT_CHANNEL = "1435294808045256704"; 

// Ruoli Staff & Tag
const ROLES = {
  PARTNERSHIP: "1434591845370957875",
  HOLDER: "1413141862906331176",
  FOUNDER: "1429034156326912124",
  CEO: "1429034157467635802",
  EXECUTIVE: "1429034166229663826",
  DIRECTOR: "1429034167781294080",
  HEAD_ADMIN: "1429034175171792988",
  ADMIN: "1429034176014843944",
  HEAD_MOD: "1429034177898086491",
  MOD: "1429034178766180444",
  HELPER: "1429034179747778560",
  TRIAL_HELPER: "1431283077824512112"
};

const STAFF_ROLES_IDS = Object.values(ROLES);

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;
    
    // Staff ignorato dall'IA
    if (message.member && message.member.roles.cache.some(r => STAFF_ROLES_IDS.includes(r.id))) return;
    
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket) return;

    const isTagged = message.mentions.has(client.user);
    if (ticket.claimed === true && !isTagged) return;

    const content = message.content.trim().toLowerCase();
    
    // Comando Chiusura Manuale
    if (isTagged && (content.includes("chiudi") || content.includes("close"))) {
        await message.reply("Ricevuto. Chiudo il ticket.");
        await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed", staffId: null, claimed: false });
        setTimeout(() => channel.delete().catch(() => {}), 5000);
        return; 
    }

    if (content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // Generazione AI
    const contextInfo = `DATI TECNICI: Utente: ${message.author.username} - Tipo: ${ticket.type}`;
    let reply = await getSmartReply(message.author.id, message.content, contextInfo);
    reply = reply.replace(/\[CONTESTO.*?\]/g, "").replace(/DATI TECNICI.*?/g, "").trim();

    // Trigger Chiusura
    if (reply.includes("TRIGGER_TICKET_CLOSE")) {
        await message.reply(reply.replace("TRIGGER_TICKET_CLOSE", "").trim() || "Chiudo il ticket.");
        await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed" });
        setTimeout(() => channel.delete().catch(() => {}), 5000);
        return;
    }

    // Trigger Chiamata Staff
    if (reply.includes("TRIGGER_STAFF_CALL")) {
        const parts = reply.split("TRIGGER_STAFF_CALL:");
        const userMsg = parts[0].trim() || "Chiedo supporto a un operatore.";
        const staffReason = parts[1] ? parts[1].trim().toLowerCase() : "Richiesta operatore.";

        await message.reply(userMsg);

        // ─────────────────────────────────────────────
        // 🧠 LOGICA DI TAGGING INTELLIGENTE
        // ─────────────────────────────────────────────
        let rolesToPing = [];
        const isPartnership = ticket.type && ticket.type.toLowerCase().includes("partnership");

        if (isPartnership) {
            // 🔒 CASO PARTNERSHIP: Tagga SOLO il manager, ignora richieste specifiche
            rolesToPing.push(ROLES.PARTNERSHIP);
        } else {
            // 🔓 CASO STANDARD: Cerca ruolo specifico
            let specificFound = false;

            if (staffReason.includes("founder") || staffReason.includes("fondatore")) { rolesToPing.push(ROLES.FOUNDER); specificFound = true; }
            if (staffReason.includes("ceo")) { rolesToPing.push(ROLES.CEO); specificFound = true; }
            if (staffReason.includes("admin")) { rolesToPing.push(ROLES.ADMIN, ROLES.HEAD_ADMIN); specificFound = true; }
            if (staffReason.includes("mod")) { rolesToPing.push(ROLES.MOD, ROLES.HEAD_MOD); specificFound = true; }

            // Se NON ha chiesto un ruolo specifico, tagga i competenti di base
            if (!specificFound) {
                 if (ticket.type.toLowerCase().includes("high")) {
                    rolesToPing.push(ROLES.FOUNDER, ROLES.CEO, ROLES.EXECUTIVE);
                 } else {
                    rolesToPing.push(ROLES.HELPER, ROLES.TRIAL_HELPER);
                 }
            }
        }

        // Rimuove duplicati
        rolesToPing = [...new Set(rolesToPing)];
        const mentions = rolesToPing.map(id => `<@&${id}>`).join(" ");

        // Invio Alert
        const alertChannel = client.channels.cache.get(TICKET_ALERT_CHANNEL);
        if (alertChannel) {
             const alertEmbed = new EmbedBuilder()
                .setColor("#e74c3c")
                .setTitle("🚨 Richiesta Supporto Staff")
                .setDescription(`L'IA ha inoltrato una richiesta manuale.`)
                .addFields(
                    { name: "Ticket", value: `<#${channel.id}>`, inline: true },
                    { name: "Motivo", value: staffReason, inline: true },
                    { name: "Reparto", value: isPartnership ? "🤝 Partnership" : "🛠️ Supporto", inline: true }
                )
                .setTimestamp();
            
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`claim_${channel.id}`).setLabel("Reclama").setStyle(ButtonStyle.Danger)
            );

            await alertChannel.send({ 
                content: `🔔 **Chiamata Staff:** ${mentions}`, 
                embeds: [alertEmbed], 
                components: [row] 
            });
        }
        return;
    }

    await message.reply(reply);
  });
}
