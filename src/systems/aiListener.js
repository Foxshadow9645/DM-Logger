// ─────────────────────────────────────────────
// 🧠 AI LISTENER — Customer Service & Ticket Manager
// ─────────────────────────────────────────────

import Ticket from "../core/models/Ticket.js";
import { EmbedBuilder } from "discord.js";

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket || ticket.claimed) return; // 🔇 SE OPERATORE PRESENTE → BOT STA ZITTO

    const content = message.content.toLowerCase();
    const user = message.author;

    if (["salve", "ciao", "hey", "buongiorno", "buonasera"].some(w => content.startsWith(w))) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#1f2937")
            .setDescription(
              `Salve ${user}, sono **DM Alpha**.\n\n` +
              `Se vuoi parlare con un operatore scrivi:\n**voglio parlare con uno staffer**`
            )
        ]
      });
    }
  });
}
