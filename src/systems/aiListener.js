// CAMBIA QUESTA RIGA:
import { getSmartReply } from "../ai/groqHandler.js"; // 👈 Era geminiHandler.js
// IL RESTO RIMANE UGUALE
import Ticket from "../core/models/Ticket.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const STAFF_ALERT_CHANNEL_ID = "1430240657179541575";

const STAFF_ROLES = [
  "1429034166229663826","1429034167781294080","1429034175171792988",
  "1429034176014843944","1429034177000509451","1429034177898086491",
  "1429034178766180444","1429034179747778560","1431283077824512112"
];

export default function aiListener(client) {
  // ... (TUTTO IL RESTO DEL CODICE CHE TI HO DATO PRIMA) ...
  // Assicurati solo di usare la funzione on_message come definita nel messaggio precedente
  client.on("messageCreate", async (message) => {
    // ... codice uguale a prima ...
    // ... quando chiami getSmartReply, ora userà Groq ...
    if (message.author.bot || !message.guild) return;

    // 2. 🛑 BLOCCA LO STAFF
    if (message.member && message.member.roles.cache.some(r => STAFF_ROLES.includes(r.id))) return;
    
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    if (message.mentions.has(client.user) && message.content.toLowerCase().includes("chiudi")) return;

    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket || ticket.claimed) return;

    const content = message.content.trim();
    if (!content || content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // Qui chiama la nuova funzione Groq
    const contextInfo = `Utente: ${message.author.tag} | Ticket Tipo: ${ticket.type}`;
    const reply = await getSmartReply(message.author.id, content, contextInfo);

    if (reply.includes("TRIGGER_STAFF_CALL")) {
        const alertChannel = client.channels.cache.get(STAFF_ALERT_CHANNEL_ID);
        if (alertChannel) {
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`claim_${channel.id}`)
                    .setLabel(`👮‍♂️ Reclama Ticket di ${message.author.username}`)
                    .setStyle(ButtonStyle.Danger)
            );
            await alertChannel.send({
                content: `🚨 **RICHIESTA INTERVENTO UMANO**\nL'utente <@${message.author.id}> richiede assistenza nel ticket <#${channel.id}>.`,
                components: [row]
            });
            await message.reply("Ho inoltrato la tua richiesta allo staff. Un operatore umano arriverà a breve.");
        } else {
            await message.reply("Errore di contatto staff. Riprova più tardi.");
        }
        return;
    }

    await message.reply({ content: reply });
  });
}
