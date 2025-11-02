// ─────────────────────────────────────────────
// 🧠 AI LISTENER — Supporto Naturale + Ticket System
// ─────────────────────────────────────────────
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const content = message.content.toLowerCase();
    const user = message.author;

    // ─────────────────────────────────────────────
    // 🗣️ SALUTO BASE + SCELTA MODALITÀ
    // ─────────────────────────────────────────────
    if (
      content.startsWith("ciao") ||
      content.startsWith("salve") ||
      content.startsWith("hey") ||
      content.startsWith("buonasera") ||
      content.startsWith("buongiorno")
    ) {
      const embed = new EmbedBuilder()
        .setColor(0x1f2937)
        .setAuthor({ name: "DM Alpha — Servizio di Supporto" })
        .setDescription(
          `Ciao ${user}, sono **DM Alpha**, l'assistente ufficiale del server.\n\n` +
            "👉 Se vuoi parlare con un operatore scrivi **voglio parlare con uno staffer**.\n" +
            "⚙️ Oppure scrivi **provo a risolvere io** per segnalare il problema e ottenere un aiuto automatico."
        )
        .setFooter({ text: "Nihil Difficile Volenti • Sistema Attivo" })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ─────────────────────────────────────────────
    // 🎟️ APERTURA TICKET CON OPERATORE
    // ─────────────────────────────────────────────
    if (content.includes("voglio parlare con uno staffer")) {
      const channel = await message.guild.channels.create({
        name: `ticket-${user.username}`,
        type: 0, // GUILD_TEXT
        topic: `Ticket aperto da ${user.tag}`,
        permissionOverwrites: [
          {
            id: message.guild.roles.everyone,
            deny: ["ViewChannel"]
          },
          {
            id: user.id,
            allow: ["ViewChannel", "SendMessages", "AttachFiles"]
          }
        ]
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("Chiudi Ticket")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔒")
      );

      const embed = new EmbedBuilder()
        .setColor(0x2563eb)
        .setTitle("🎟️ Ticket Operatore Aperto")
        .setDescription(
          `Benvenuto ${user}, un membro dello staff ti assisterà a breve.\n\n` +
            "Puoi chiudere questo ticket in qualsiasi momento cliccando il pulsante qui sotto o scrivendo **chiudi il ticket**."
        )
        .setFooter({ text: "DM Alpha — Support Desk" })
        .setTimestamp();

      await channel.send({ embeds: [embed], components: [row] });
      return message.reply({
        content: `✅ Ticket creato con successo: ${channel}`,
        ephemeral: true
      });
    }

    // ─────────────────────────────────────────────
    // ⚙️ SUPPORTO AUTOMATICO ("Provo a risolvere io")
    // ─────────────────────────────────────────────
    if (content.includes("provo a risolvere io")) {
      const embed = new EmbedBuilder()
        .setColor(0x1f2937)
        .setAuthor({ name: "DM Alpha — AutoSupport" })
        .setDescription(
          `Perfetto ${user}, descrivi qui sotto il problema in modo dettagliato.\n\n` +
            "📘 Il sistema cercherà di aiutarti automaticamente oppure invierà la segnalazione al Dipartimento Staff."
        )
        .setFooter({ text: "Sistema di Assistenza Automatica Attivo" })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ─────────────────────────────────────────────
    // 🔒 CHIUSURA AUTOMATICA TICKET SU RICHIESTA
    // ─────────────────────────────────────────────
    const closeTriggers = [
      "chiudi il ticket",
      "puoi chiudere",
      "ho risolto",
      "puoi chiudere il ticket",
      "grazie puoi chiudere"
    ];

    if (closeTriggers.some((t) => content.includes(t))) {
      if (message.channel.name.startsWith("ticket-")) {
        const embed = new EmbedBuilder()
          .setColor(0x9ca3af)
          .setTitle("🔒 Ticket Chiuso")
          .setDescription(`Il ticket è stato chiuso su richiesta di ${user}.`)
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
        setTimeout(() => message.channel.delete().catch(() => {}), 5000);
      }
    }

    // ─────────────────────────────────────────────
    // 🚨 LINGUAGGIO INAPPROPRIATO (Controllo Moderato)
    // ─────────────────────────────────────────────
    if (content.includes("gay") || content.includes("frocio") || content.includes("insulto")) {
      const embed = new EmbedBuilder()
        .setColor(0xe11d48)
        .setTitle("⚠️ Linguaggio Inappropriato")
        .setDescription(
          `Il tuo messaggio è stato segnalato al **Dipartimento Sicurezza** per revisione.\n\n` +
            "Ricorda che il rispetto è una condizione fondamentale del server."
        )
        .setFooter({ text: "Sistema di Sorveglianza Attivo" })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    }
  });

  // ─────────────────────────────────────────────
  // 🔘 CHIUSURA TICKET CON PULSANTE
  // ─────────────────────────────────────────────
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === "close_ticket") {
      const embed = new EmbedBuilder()
        .setColor(0x9ca3af)
        .setTitle("🔒 Ticket Chiuso")
        .setDescription(`Il ticket è stato chiuso da ${interaction.user}.`)
        .setTimestamp();

      await interaction.channel.send({ embeds: [embed] });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  });
}
