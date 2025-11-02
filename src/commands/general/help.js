import { EmbedBuilder } from "discord.js";

export default {
  name: "help",
  description: "Mostra i comandi e i moduli disponibili",
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("🧠 DM REALM ALPHA — Command Center")
      .setDescription(
        "Modulo di controllo interno al sistema DM ALPHA LOGGER.\n\n" +
        "📂 **Comandi Generali**\n" +
        "`/ping` — verifica connessione\n" +
        "`/help` — mostra questa lista\n\n" +
        "🎟️ **Ticket System**\n" +
        "`/setup-ticket-panel` — crea il pannello di apertura ticket\n" +
        "`/close-ticket` — chiude un ticket\n\n" +
        "🪖 **Staff Moderation**\n" +
        "`/warn-user` — invia un avvertimento\n" +
        "`/mute-user` — timeout temporaneo\n" +
        "`/view-logs` — visualizza i log utente"
      )
      .setColor("#1E3A8A")
      .setFooter({ text: "Nihil Difficile Volenti • DM REALM ALPHA" });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

