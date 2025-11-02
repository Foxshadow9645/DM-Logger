import Ticket from "../../core/models/Ticket.js";

export default {
  name: "close-ticket",
  description: "Chiude il ticket corrente",
  async execute(interaction) {
    const channel = interaction.channel;
    const ticket = await Ticket.findOne({ channelId: channel.id, status: "open" });

    if (!ticket)
      return interaction.reply({ content: "❌ Questo canale non è un ticket aperto.", ephemeral: true });

    await Ticket.updateOne({ channelId: channel.id }, { status: "closed", closedAt: new Date() });

    await channel.send("📁 Il ticket è stato chiuso e archiviato nel database. Chiusura automatica in 10 secondi.");
    setTimeout(() => channel.delete().catch(() => {}), 10000);

    await interaction.reply({ content: "✅ Ticket chiuso correttamente.", ephemeral: true });
  }
};
