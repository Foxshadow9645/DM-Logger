import fetch from "node-fetch";
import Ticket from "../models/Ticket.js";
import { EmbedBuilder } from "discord.js";

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket || ticket.claimed) return; // Se uno staffer ha già preso il ticket → AI non parla

    const content = message.content.toLowerCase();
    const user = message.author;

    // ✅ Catch frasi che richiedono direttamente staff
    if (content.includes("voglio parlare con uno staff") || content.includes("operatore")) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#facc15")
            .setDescription(`📢 Richiesta di assistenza inoltrata.\nUno staffer verrà notificato e prenderà in carico il ticket.`)
        ]
      });
    }

    // ✅ Saluto iniziale
    if (["salve", "ciao", "hey", "buongiorno", "buonasera"].some(w => content.startsWith(w))) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#1f2937")
            .setDescription(
              `Salve ${user}, sono **DM Alpha**.\n` +
              `Sono qui per assisterti finché uno staff non prenderà in carico il ticket.\n\n` +
              `Se desideri parlare con uno staffer digita:\n**voglio parlare con uno staff**`
            )
        ]
      });
    }

    // ✅ Invio della richiesta al microservizio AI
    try {
      const response = await fetch(process.env.AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: content, context: "Support ticket conversation" })
      });

      const data = await response.json();
      const reply = data.reply || "Al momento non riesco ad elaborare la richiesta."

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#4b5563")
            .setDescription(reply)
        ]
      });

    } catch (err) {
      console.error("❌ Errore AI Listener:", err.message);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#dc2626")
            .setDescription("⚠️ Non riesco a contattare il supporto automatico. Lo staff è stato notificato.")
        ]
      });
    }
  });
}
