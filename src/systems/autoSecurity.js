export default function autoSecurity(client) {
  client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (!msg.channel.name.includes("ticket")) return;

    // rileva spam
    const tooLong = msg.content.length > 1000;
    const mentions = msg.mentions.users.size > 5;

    if (tooLong || mentions) {
      await msg.delete().catch(() => {});
      await msg.channel.send({
        content: "⚠️ Messaggio rimosso per motivi di sicurezza (spam o flood)."
      });
    }
  });
}

