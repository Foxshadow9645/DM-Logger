import { getSmartReply } from "../ai/groqHandler.js"; // Assicurati che punti al handler che stai usando (groq o gemini)
import Ticket from "../core/models/Ticket.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

// ID del canale dove notificare lo staff
const STAFF_ALERT_CHANNEL_ID = "1197583344356053083";

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

    // 2. 🛑 BLOCCA LO STAFF
    if (message.member && message.member.roles.cache.some(r => STAFF_ROLES.includes(r.id))) return;
    
    // 3. Verifica canale ticket
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    // 4. Se l'utente vuole chiudere, ignora
    if (message.mentions.has(client.user) && message.content.toLowerCase().includes("chiudi")) return;

    // 5. Recupera Ticket DB
    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket || ticket.claimed) return; // Se già reclamato, silenzio.

    const content = message.content.trim();
    if (!content || content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // 6. Genera risposta AI
    const contextInfo = `Utente: ${message.author.tag} | Ticket Tipo: ${ticket.type}`;
    const reply = await getSmartReply(message.author.id, content, contextInfo);

    // ─────────────────────────────────────────────
    // 🚨 RILEVAMENTO TRIGGER INTELLIGENTE
    // ─────────────────────────────────────────────
    if (reply.includes("TRIGGER_STAFF_CALL")) {
        
        // Estraiamo il riassunto del problema dopo i due punti
        // Esempio reply: "TRIGGER_STAFF_CALL: L'utente non riesce a verificare l'account."
        const splitReply = reply.split("TRIGGER_STAFF_CALL:");
        const problemSummary = splitReply[1] ? splitReply[1].trim() : "L'utente richiede assistenza generica.";

        const alertChannel = client.channels.cache.get(STAFF_ALERT_CHANNEL_ID);

        if (alertChannel) {
            // Bottone per reclamare
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`claim_${channel.id}`)
                    .setLabel(`👮‍♂️ Reclama Ticket`)
                    .setStyle(ButtonStyle.Danger)
            );

            // 📨 EMBED DETTAGLIATO PER LO STAFF
            const alertEmbed = new EmbedBuilder()
                .setColor("#e74c3c") // Rosso
                .setTitle("🚨 Richiesta Intervento Staff")
                .setDescription(`Un utente richiede supporto umano. Ecco il riassunto elaborato dall'IA:`)
                .addFields(
                    { name: "👤 Utente", value: `<@${message.author.id}>`, inline: true },
                    { name: "📍 Canale", value: `<#${channel.id}>`, inline: true },
                    { name: "⚠️ Problema Rilevato", value: `**${problemSummary}**` }
                )
                .setTimestamp()
                .setFooter({ text: "Clicca il bottone per zittire l'AI e intervenire." });

            await alertChannel.send({
                content: `<@&1429034166229663826>`, // Tagga un ruolo staff se vuoi (opzionale) o togli questa riga
                embeds: [alertEmbed],
                components: [row]
            });

            // ✅ Risposta all'utente (senza far vedere il codice interno)
            await message.reply({ 
                content: "Ho inoltrato la tua richiesta allo staff includendo i dettagli del problema. Un operatore arriverà a breve." 
            });

        } else {
            await message.reply("Errore di contatto staff. Riprova più tardi.");
        }
        return; // Stop, non inviare il messaggio "TRIGGER..." in chat
    }

    // Risposta normale (se non chiama lo staff, o se sta ancora chiedendo info)
    await message.reply({ content: reply });
  });
}
