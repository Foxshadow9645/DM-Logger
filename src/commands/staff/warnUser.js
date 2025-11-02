import Log from "../../core/models/Log.js";

export default {
  name: "warn-user",
  description: "Invia un avvertimento disciplinare a un utente",
  options: [
    {
      name: "user",
      description: "Utente da avvertire",
      type: 6,
      required: true
    },
    {
      name: "reason",
      description: "Motivo dell'avvertimento",
      type: 3,
      required: true
    }
  ],
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const executor = interaction.user;

    const desc = [
      "⚠️ **Avvertimento Disciplinare**",
      `👤 Utente: ${user}`,
      `👮 Moderatore: ${executor}`,
      `📄 Motivo: ${reason}`,
      `🕒 <t:${Math.floor(Date.now() / 1000)}:F>`
    ].join("\n");

    await Log.create({
      type: "warn",
      userId: user.id,
      executorId: executor.id,
      description: reason,
      guildId: interaction.guild.id
    });

    await user.send(`⚠️ Sei stato avvertito da ${executor.tag} per: ${reason}`).catch(() => {});
    await interaction.reply({ content: "✅ Avvertimento registrato e inviato.", ephemeral: true });
  }
};

