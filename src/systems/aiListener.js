import { getSmartReply } from "../ai/geminiHandler.js";
import Ticket from "../core/models/Ticket.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

// ID del canale dove notificare lo staff
const STAFF_ALERT_CHANNEL_ID = "1430240657179541575";

// 🛡️ LISTA RUOLI STAFF (L'IA deve ignorare chi ha questi ruoli)
const STAFF_ROLES = [
  "1429034166229663826","1429034167781294080","1429034175171792988",
  "1429034176014843944","1429034177000509451","1429034177898086491",
  "1429034178766180444","1429034179747778560","1431283077824512112"
];

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    // 1. Controlli base (no bot, deve essere in una guild)
    if (message.author.bot || !message.guild) return;

    // 2. 🛑 BLOCCA LO STAFF: Se chi scrive è uno staffer, l'IA non deve rispondere
    if (message.member && message.member.roles.cache.some(r => STAFF_ROLES.includes(r.id))) {
      return; 
    }
    
    // 3. Verifica se è un canale ticket
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    // 4. Se l'utente vuole chiudere, lasciamo fare al sistema di chiusura
    if (message.mentions.has(client.user) && message.content.toLowerCase().includes("chiudi")) return;

    // 5. Recupera info ticket dal Database
    const ticket = await Ticket.findOne({ channelId: channel.id });
    
    // 🛑 SE IL TICKET È GIÀ RECLAMATO (CLAIMED), L'IA DEVE STARE ZITTA
    if (!ticket || ticket.claimed) return;

    const content = message.content.trim();
    if (!content || content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // 6. Genera la risposta
    const contextInfo = `Utente: ${message.author.tag} | Ticket Tipo: ${ticket.type}`;
    const reply = await getSmartReply(message.author.id, content, contextInfo);

    // 🚨 RILEVAMENTO RICHIESTA STAFF (TRIGGER)
    if (reply.includes("TRIGGER_STAFF_CALL")) {
        
        const alertChannel = client.channels.cache.get(STAFF_ALERT_CHANNEL_ID);

        if (alertChannel) {
            // Bottone per reclamare
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`claim_${channel.id}`)
                    .setLabel(`👮‍♂️ Reclama Ticket di ${message.author.username}`)
                    .setStyle(ButtonStyle.Danger)
            );

            // 📨 Manda la notifica SOLO nel canale Staff
            await alertChannel.send({
                content: `🚨 **RICHIESTA INTERVENTO UMANO**\nL'utente <@${message.author.id}> richiede assistenza nel ticket <#${channel.id}>.`,
                components: [row]
            });

            // Conferma all'utente (senza bottoni)
            await message.reply("Ho inoltrato la tua richiesta allo staff. Un operatore umano arriverà a breve.");
        } else {
            console.error(`❌ Canale notifica staff non trovato: ${STAFF_ALERT_CHANNEL_ID}`);
            await message.reply("Errore di contatto staff. Riprova più tardi.");
        }
        return;
    }

    // Risposta normale dell'IA all'utente
    await message.reply({ content: reply });
  });
}
