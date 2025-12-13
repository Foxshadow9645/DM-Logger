export default function autoSecurity(client) {
  client.on("messageCreate", async (msg) => {
    // 1. Ignora i bot e i canali che non sono ticket
    if (msg.author.bot) return;
    if (!msg.channel.name.includes("ticket")) return;

    // ─────────────────────────────────────────────
    // 🟢 ECCEZIONE PARTNERSHIP
    // ─────────────────────────────────────────────
    // Se il topic del canale indica che è una Partnership,
    // IGNORIAMO i controlli di sicurezza (permettiamo link e testi lunghi)
    if (msg.channel.topic && msg.channel.topic.includes("Partnership")) {
        return; 
    }

    // ─────────────────────────────────────────────
    // 🛡️ CONTROLLI ANTI-SPAM (Solo per altri ticket)
    // ─────────────────────────────────────────────
    
    // Rileva messaggi troppo lunghi (> 1000 caratteri)
    const tooLong = msg.content.length > 1000;
    
    // Rileva troppe menzioni (> 5 utenti taggati)
    const mentions = msg.mentions.users.size > 5;

    if (tooLong || mentions) {
      await msg.delete().catch(() => {});
      await msg.channel.send({
        content: "⚠️ **Messaggio rimosso dal sistema.**\nNon è consentito inviare messaggi eccessivamente lunghi o spam di tag in questo ticket (misura anti-raid)."
      });
    }
  });
}
