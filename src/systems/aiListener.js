// ─────────────────────────────────────────────
// 🧠 AI LISTENER — Customer Service / Ticket Manager
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
    // 💬 SALUTO BASE - Customer Service Style
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
        .setAuthor({ name: "DM Alpha — Customer Service" })
        .setDescription(
          `Salve ${user}, sono **DM Alpha**, il servizio di assistenza ufficiale del server.\n\n` +
            "👉 Se desideri parlare con un operatore umano, scrivi **voglio parlare con uno staffer**.\n" +
            "⚙️ Oppure scrivi **provo a risolvere io** per avviare una segnalazione automatica."
        )
        .setFooter({ text: "Nihil Difficile Volenti • Sistema Attivo" })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ─────────────────────────────────────────────
    // 🎟️ CREA NUOVO TICKET + CHIUDI IL CORRENTE
    // ─────────────────────────────────────────────
    if (content.includes("voglio parlare con uno staffer")) {
      const guild = message.guild;

      // ✅ Crea il nuovo ticket privato
      const newTicket = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: 0, // GUILD_TEXT
        topic: `Richiesta assistenza aperta da ${user.tag}`,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: ["ViewChannel"]
          },
          {
            id: user.id,
            allow: ["ViewChannel", "SendMessages", "AttachFiles"]
          }
        ]
      });

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("Chiudi Ticket")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔒")
      );

      // 🪖 Messaggio di benvenuto nel nuovo ticket
      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x2563eb)
        .setTitle("🎟️ Benvenuto nel Customer Service DM Alpha")
        .setDescription(
          `Salve ${user}, un membro dello **Staff Operativo** la assisterà a breve.\n\n` +
            "Può descrivere la sua richiesta o problema qui sotto. " +
            "Quando la conversazione sarà conclusa, può chiudere il ticket cliccando il pulsante o scrivendo **chiudi il ticket**."
        )
        .setFooter({ text: "DM Alpha — Support Desk" })
        .setTimestamp();

      await newTicket.send({ embeds: [welcomeEmbed], components: [closeRow] });

      // Risposta nel ticket originale
      await message.reply({
        content: `✅ Ho creato un canale dedicato per la tua assistenza: ${newTicket}`,
      });

      // 🔒 Chiudi il ticket precedente (dove è stato scritto “voglio parlare con uno staffer”)
      if (message.channel.name.startsWith("ticket-")) {
        const closingEmbed = new EmbedBuilder()
          .setColor(0x9ca3af)
          .setTitle("🔒 Ticket Trasferito")
          .setDescription(
            `La conversazione è stata trasferita su ${newTicket}.\nQuesto ticket verrà chiuso automaticamente.`
          )
          .setTimestamp();

        await message.channel.send({ embeds: [closingEmbed] });
        setTimeout(() => message.channel.delete().catch(() => {}), 5000);
      }
    }

    // ─────────────────────────────────────────────
    // ⚙️ SUPPORTO AUTOMATICO
    // ─────────────────────────────────────────────
    if (content.includes("provo a risolvere io")) {
      const embed = new EmbedBuilder()
        .setColor(0x374151)
        .setAuthor({ name: "DM Alpha — AutoSupport" })
        .setDescription(
          `Va bene ${user}, descriva il problema in modo dettagliato qui sotto.\n\n` +
            "📘 Il sistema cercherà di identificare la causa del problema o di inoltrare la segnalazione al **Dipartimento Tecnico**."
        )
        .setFooter({ text: "Sistema di Assistenza Automatica Attivo" })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ─────────────────────────────────────────────
    // 🔒 CHIUSURA AUTOMATICA SU RICHIESTA
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
    // 🚨 LINGUAGGIO INAPPROPRIATO
    // ─────────────────────────────────────────────
    if (content.includes("gay") || content.includes("frocio") || content.includes("insulto")) {
      const embed = new EmbedBuilder()
        .setColor(0xe11d48)
        .setTitle("⚠️ Linguaggio Inappropriato")
        .setDescription(
          `Il messaggio è stato segnalato al **Dipartimento Sicurezza**.\n` +
            "Le ricordiamo che l'uso di linguaggio offensivo non è tollerato nel server."
        )
        .setFooter({ text: "Sistema di Sorveglianza Attivo" })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    }
  });

  // ─────────────────────────────────────────────
  // 🔘 CHIUSURA MANUALE CON PULSANTE
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
