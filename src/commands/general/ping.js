export default {
  name: "ping",
  description: "Verifica la latenza e lo stato del sistema",
  async execute(interaction) {
    const start = Date.now();
    await interaction.reply({ content: "🏓 Pinging...", ephemeral: true });
    const end = Date.now();

    const latency = end - start;
    const apiPing = interaction.client.ws.ping;

    await interaction.editReply({
      content: `✅ **Sistema operativo**
      \n⏱️ Latenza: ${latency}ms
      \n📡 API Discord: ${apiPing}ms
      \n🧠 Moduli attivi: Logger, Ticket, AI, Sicurezza`
    });
  }
};

