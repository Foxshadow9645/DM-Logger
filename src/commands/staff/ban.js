import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import Log from "../../core/models/Log.js";

export default {
  name: "ban",
  description: "🔨 Banna un utente dal server con stile",
  defaultMemberPermissions: PermissionFlagsBits.BanMembers,
  options: [
    {
      name: "user",
      description: "L'utente da bannare",
      type: 6, // USER
      required: true
    },
    {
      name: "reason",
      description: "Il motivo del ban",
      type: 3, // STRING
      required: true
    },
    {
      name: "delete_msg",
      description: "Cancella la cronologia messaggi",
      type: 4, // INTEGER
      required: false,
      choices: [
        { name: "Nessuno", value: 0 },
        { name: "Ultima Ora", value: 3600 },
        { name: "Ultime 24 Ore", value: 86400 },
        { name: "Ultimi 7 Giorni", value: 604800 }
      ]
    }
  ],
  async execute(interaction) {
    // Rispondiamo subito per evitare timeout
    await interaction.deferReply({ ephemeral: true });

    const targetUser = interaction.options.getUser("user");
    const targetMember = interaction.options.getMember("user");
    const reason = interaction.options.getString("reason");
    const deleteSeconds = interaction.options.getInteger("delete_msg") || 0;
    const executor = interaction.user;

    // ─────────────────────────────────────────────
    // 1. CONTROLLI DI SICUREZZA
    // ─────────────────────────────────────────────
    
    if (!targetMember) {
        return interaction.editReply({ 
            content: "❌ L'utente non è nel server (o non può essere trovato)." 
        });
    }

    if (!targetMember.bannable) {
        return interaction.editReply({ 
            content: "⛔ **Errore:** Non ho i permessi per bannare questo utente (è admin o ha un ruolo superiore al mio)." 
        });
    }

    if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
        return interaction.editReply({ 
            content: "⛔ **Gerarchia:** Non puoi bannare qualcuno con un grado pari o superiore al tuo." 
        });
    }

    // ─────────────────────────────────────────────
    // 2. CREAZIONE EMBED PER L'UTENTE (DM)
    // ─────────────────────────────────────────────
    const dmEmbed = new EmbedBuilder()
        .setTitle(`🚫 Sei stato bannato da ${interaction.guild.name}`)
        .setColor("#ff0000")
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }) || null)
        .addFields(
            { name: "👮 Esecutore", value: `${executor.tag}`, inline: true },
            { name: "📅 Data", value: `<t:${Math.floor(Date.now() / 1000)}:d>`, inline: true },
            { name: "📄 Motivo", value: `\`\`\`${reason}\`\`\``, inline: false }
        )
        .setFooter({ text: "Non puoi rispondere a questo messaggio." })
        .setTimestamp();

    let dmStatus = "✅ Inviato";

    // Tenta di inviare il DM PRIMA del ban
    try {
        await targetUser.send({ embeds: [dmEmbed] });
    } catch (err) {
        dmStatus = "❌ Fallito (DM Chiusi)";
    }

    // ─────────────────────────────────────────────
    // 3. ESECUZIONE BAN E SALVATAGGIO LOG
    // ─────────────────────────────────────────────
    try {
        // Ban effettivo su Discord
        await targetMember.ban({ 
            deleteMessageSeconds: deleteSeconds, 
            reason: `[Bannato da ${executor.tag}] ${reason}` 
        });

        // Salvataggio nel Database (Log.js)
        await Log.create({
            type: "ban",
            userId: targetUser.id,
            executorId: executor.id,
            description: reason,
            guildId: interaction.guild.id,
            timestamp: new Date()
        });

        // ─────────────────────────────────────────────
        // 4. EMBED DI CONFERMA PER LO STAFF
        // ─────────────────────────────────────────────
        const successEmbed = new EmbedBuilder()
            .setTitle("🔨 Utente Bannato con Successo")
            .setColor("#2b2d31")
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "👤 Utente", value: `${targetUser} (\`${targetUser.id}\`)`, inline: true },
                { name: "🛡️ Staff", value: `${executor}`, inline: true },
                { name: "📨 Notifica DM", value: `\`${dmStatus}\``, inline: true },
                { name: "📝 Motivo", value: `${reason}`, inline: false }
            )
            .setFooter({ text: "Log salvato nel database", iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
        console.error(error);
        await interaction.editReply({ content: "❌ C'è stato un errore durante l'esecuzione del ban." });
    }
  }
};
