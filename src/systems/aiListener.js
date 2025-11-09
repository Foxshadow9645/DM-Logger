import { askAI } from "../ai/api.js";
import Ticket from "../core/models/Ticket.js";
import { EmbedBuilder } from "discord.js";

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;
    const channel = message.channel;
    if (!channel.name.startsWith("ticket-")) return;

    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket || ticket.claimed) return;

    const content = message.content.trim();
    const user = message.author;

    // Invoca AI Pipedream
    const reply = await askAI(content, `Utente: ${user.tag} | Ticket ID: ${ticket._id}`);

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#1f2937")
          .setDescription(`**DM Alpha**: ${reply}`),
      ],
    });
  });
}
