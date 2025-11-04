import Ticket from "../core/models/Ticket.js";
import { EmbedBuilder } from "discord.js";

export default function ticketClose(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "ticket_close") return;

    const channel = interaction.channel;
    const user = interaction.user;

    await Ticket.findOneAndUpdate(
      { channelId: channel.id },
      { status: "closed", staffId: null, claimed: false }
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#9ca3af")
          .setTitle("🔒 Ticket Chiuso")
          .setDescription(`Il ticket è stato chiuso da <@${user.id}>`)
          .setTimestamp()
      ]
    });

    setTimeout(() => channel.delete().catch(() => {}), 3000);
  });

  // Chiusura tramite messaggio
  client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;
    const channel = message.channel;

    if (!channel.name.startsWith("ticket-")) return;

    const content = message.content.toLowerCase();
    const user = message.author;

    if (
      content.includes("chiudi il ticket") ||
      content.includes("ho risolto") ||
      content.includes("puoi chiudere") ||
      content.includes("grazie puoi chiudere")
    ) {
      await Ticket.findOneAndUpdate(
        { channelId: channel.id },
        { status: "closed", staffId: null, claimed: false }
      );

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#9ca3af")
            .setTitle("🔒 Ticket Chiuso")
            .setDescription(`Richiesto da <@${user.id}>`)
            .setTimestamp()
        ]
      });

      setTimeout(() => channel.delete().catch(() => {}), 3000);
    }
  });
}
