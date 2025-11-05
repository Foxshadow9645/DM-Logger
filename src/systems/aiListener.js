// ─────────────────────────────────────────────
// 🧠 AI LISTENER — Customer Service & Ticket Manager (L2)
// ─────────────────────────────────────────────

import Ticket from "../core/models/Ticket.js";
import { EmbedBuilder } from "discord.js";
import fetch from "node-fetch";

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    // Carica stato ticket
    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket) return;

    // 🔇 Se lo staff ha reclamato → AI tace
    if (ticket.claimed === true) return;

    const userMessage = message.content.trim();
    const user = message.author;

    // 👋 Risposte iniziali di cortesia
    if (["salve", "ciao", "hey", "buongiorno", "buonasera"].some(w => userMessage.toLowerCase().startsWith(w))) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#1f2937")
            .setDescription(
              `Salve ${user}, sono **DM Alpha**.\n\n` +
              `Sono qui per assisterti finché uno staffer non prenderà in carico il ticket.\n` +
              `Se desideri parlare con un operatore digita:\n**voglio parlare con uno staffer**`
            )
        ]
      });
    }

    // 🧠 Se l'utente chiede staff → Escalation
    if (userMessage.toLowerCase().includes("voglio parlare con uno staff")) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#2563eb")
            .setDescription(
              `Ho inoltrato la richiesta.\nUn membro dello staff risponderà il prima possibile.`
            )
        ]
      });
    }

    // 🤖 Passaggio all'AI Microservizio
    try {
      const response = await fetch(`${process.env.AI_URL || "http://localhost:4000"}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage })
      });

      const data = await response.json();
      if (!data?.reply) return;

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#0ea5e9")
            .setDescription(data.reply)
        ]
      });

    } catch (err) {
      console.error("❌ Errore AI Listener:", err.message);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#ef4444")
            .setDescription(
              `Al momento non riesco a elaborare la richiesta, ma lo staff è stato notificato.`
            )
        ]
      });
    }
  });
}
