import Log from "../../core/models/Log.js";
import { EmbedBuilder } from "discord.js";

export default {
  name: "view-logs",
  description: "Visualizza gli ultimi log di un utente",
  options: [
    {
      name: "user",
      description: "Utente da controllare",
      type: 6,
      required: true
    }
  ],
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const logs = await Log.find({ userId: user.id }).sort({ timestamp: -1 }).limit(5);

    if (!logs.length)
      return interaction.reply({ content: "📭 Nessun log trovato per questo utente.", ephemeral: true });

    const logList = logs
      .map(
        l =>
          `🔹 **${l.type.toUpperCase()}** — <t:${Math.floor(l.timestamp.getTime() / 1000)}:F>\n> ${l.description}`
      )
      .join("\n\n");

    const embed = new EmbedBuilder()
      .setTitle(`📜 Log recenti di ${user.tag}`)
      .setDescription(logList)
      .setColor("#1E3A8A");

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

