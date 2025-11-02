export default {
  name: "mute-user",
  description: "Applica un timeout temporaneo a un utente",
  options: [
    {
      name: "user",
      description: "Utente da mutare",
      type: 6,
      required: true
    },
    {
      name: "duration",
      description: "Durata in minuti",
      type: 4,
      required: true
    },
    {
      name: "reason",
      description: "Motivo del timeout",
      type: 3,
      required: false
    }
  ],
  async execute(interaction) {
    const member = interaction.options.getMember("user");
    const duration = interaction.options.getInteger("duration");
    const reason = interaction.options.getString("reason") || "Nessuna motivazione";

    if (!member.moderatable)
      return interaction.reply({ content: "❌ Non posso mutare questo utente.", ephemeral: true });

    const ms = duration * 60000;
    await member.timeout(ms, reason);

    await interaction.reply({
      content: `🔇 Timeout applicato a ${member.user.tag} per ${duration} minuti.`,
      ephemeral: true
    });
  }
};

