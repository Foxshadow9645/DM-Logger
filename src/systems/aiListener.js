import { getSmartReply } from "../ai/groqHandler.js"; 
import Ticket from "../core/models/Ticket.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { performClose } from "./ticketClose.js"; // 👈 Importiamo la funzione di chiusura da sopra

// Configurazione
const TICKET_ALERT_CHANNEL = "1435285738185953390"; 

// Ruoli Staff da ignorare (l'IA non risponde a loro)
const STAFF_ROLES_IDS = [
  "1413141862906331176", "1429034156326912124", "1429034157467635802", 
  "1429034166229663826", "1429034167781294080", "1429034175171792988", 
  "1429034176014843944", "1429034177898086491", "1429034178766180444", 
  "1429034179747778560", "1431283077824512112", "1434591845370957875"
];

// Mappa Ruoli per i Tag
const ROLES = {
  PARTNERSHIP: "1434591845370957875",
  FOUNDER: "1429034156326912124",
  CEO: "1429034157467635802",
  EXECUTIVE: "1429034166229663826",
  ADMIN: "1429034176014843944",
  HEAD_ADMIN: "1429034175171792988",
  MOD: "1429034178766180444",
  HEAD_MOD: "1429034177898086491",
  HELPER: "1429034179747778560",
  TRIAL_HELPER: "1431283077824512112"
};

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    // Controlli preliminari
    if (message.author.bot || !message.guild) return;
    if (message.member && message.member.roles.cache.some(r => STAFF_ROLES_IDS.includes(r.id))) return;
    
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket) return;

    // Se ticket reclamato, IA muta (tranne se taggata)
    const isTagged = message.mentions.has(client.user);
    if (ticket.claimed === true && !isTagged) return;

    const content = message.content.trim().toLowerCase();

    // ─────────────────────────────────────────────
    // 1. CHIUSURA MANUALE (Comando Testuale)
    // ─────────────────────────────────────────────
    if (isTagged && (content.includes("chiudi") || content.includes("close") || content.includes("fine"))) {
        await message.reply("Ricevuto.");
        // Messaggio di stato salvataggio
        await channel.send("⏳ **Sto salvando la chat (HTML + TXT) e chiudendo il ticket...**");
        
        // Esegue chiusura
        await performClose(client, channel, message.guild, message.author);
        return; 
    }

    if (content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // ─────────────────────────────────────────────
    // 2. IA GENERATION
    // ─────────────────────────────────────────────
    const contextInfo = `DATI TECNICI: Utente: ${message.author.username} - Tipo: ${ticket.type}`;
    let reply = await getSmartReply(message.author.id, message.content, contextInfo);
    reply = reply.replace(/\[CONTESTO.*?\]/g, "").replace(/DATI TECNICI.*?/g, "").trim();

    // A. TRIGGER CHIUSURA DA AI
    if (reply.includes("TRIGGER_TICKET_CLOSE")) {
        const cleanMsg = reply.replace("TRIGGER_TICKET_CLOSE", "").trim();
        
        // 1. Risposta dell'IA (es. "Va bene, chiudo.")
        await message.reply(cleanMsg || "Chiudo il ticket come richiesto.");
        
        // 2. Messaggio di Avviso Salvataggio (Richiesto da te)
        await channel.send("⏳ **Sto salvando la chat (HTML + TXT) e chiudendo il ticket...**");

        // 3. Esecuzione Chiusura
        await performClose(client, channel, message.guild, null); 
        return;
    }

    // B. TRIGGER STAFF CALL
    if (reply.includes("TRIGGER_STAFF_CALL")) {
        const parts = reply.split("TRIGGER_STAFF_CALL:");
        const userMsg = parts[0].trim() || "Chiedo supporto a un operatore.";
        const staffReason = parts[1] ? parts[1].trim().toLowerCase() : "Richiesta operatore.";

        await message.reply(userMsg);

        // Calcolo Ruoli
        let rolesToPing = [];
        const isPartnership = ticket.type && ticket.type.toLowerCase().includes("partnership");

        if (isPartnership) {
            rolesToPing.push(ROLES.PARTNERSHIP);
        } else {
            let specificFound = false;
            if (staffReason.includes("founder")) { rolesToPing.push(ROLES.FOUNDER); specificFound = true; }
            if (staffReason.includes("ceo")) { rolesToPing.push(ROLES.CEO); specificFound = true; }
            if (staffReason.includes("admin")) { rolesToPing.push(ROLES.ADMIN, ROLES.HEAD_ADMIN); specificFound = true; }
            if (staffReason.includes("mod")) { rolesToPing.push(ROLES.MOD, ROLES.HEAD_MOD); specificFound = true; }

            if (!specificFound) {
                 if (ticket.type.toLowerCase().includes("high")) rolesToPing.push(ROLES.FOUNDER, ROLES.CEO, ROLES.EXECUTIVE);
                 else rolesToPing.push(ROLES.HELPER, ROLES.TRIAL_HELPER);
            }
        }

        rolesToPing = [...new Set(rolesToPing)];
        const mentions = rolesToPing.map(id => `<@&${id}>`).join(" ");

        const alertChannel = client.channels.cache.get(TICKET_ALERT_CHANNEL);
        if (alertChannel) {
             const alertEmbed = new EmbedBuilder()
                .setColor("#e74c3c")
                .setTitle("🚨 Richiesta Supporto Staff")
                .setDescription(`L'IA ha inoltrato una richiesta manuale.`)
                .addFields(
                    { name: "Ticket", value: `<#${channel.id}>`, inline: true },
                    { name: "Motivo", value: staffReason, inline: true }
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
