import { getSmartReply } from "../ai/geminiHandler.js";
import Ticket from "../core/models/Ticket.js";
import { EmbedBuilder } from "discord.js";

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    // Ignora bot e messaggi fuori dai server
    if (message.author.bot || !message.guild) return;
    
    // Controlla se siamo in un canale ticket
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    // Recupera info ticket dal DB
    const ticket = await Ticket.findOne({ channelId: channel.id });
    
    // Se il ticket non esiste o è GIA' reclamato da uno staffer, l'IA deve stare zitta
    if (!ticket || ticket.claimed) return;

    const content = message.content.trim();
    // Ignora messaggi vuoti o comandi (che iniziano con / o !)
    if (!content || content.startsWith("/") || content.startsWith("!")) return;

    await channel.sendTyping();

    // Invoca Gemini Handler
    // Passiamo l'ID utente come chiave di memoria, così ricorda chi è
    const contextInfo = `Utente: ${message.author.tag} | Ticket Tipo: ${ticket.type}`;
    const reply = await getSmartReply(message.author.id, content, contextInfo);

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#2b2d31") // Un grigio scuro professionale
          .setDescription(`🤖 **DM Alpha AI:**\n${reply}`)
          .setFooter({ text: "Risposta generata automaticamente • Attendi uno Staffer per assistenza umana" })
      ],
    });
  });
}
