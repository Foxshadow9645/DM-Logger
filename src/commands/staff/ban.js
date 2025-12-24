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
    const targetMember = interaction.options.getMember("user"); // Può essere null se l'utente non è nel server
    const reason = interaction.options.getString("reason");
    const deleteSeconds = interaction.options.getInteger("delete_msg") || 0;
    const executor = interaction.user; // Oggetto User
    const executorMember = interaction.member; // Oggetto GuildMember (con i ruoli)

    // ─────────────────────────────────────────────
    // 1. CONTROLLI DI SICUREZZA
    // ─────────────────────────────────────────────
    
    // Se l'utente non è nel server, non possiamo controllare i ruoli, ma possiamo bannarlo tramite ID (Hackban)
    // Se targetMember è null, significa che l'utente non è nel server. In quel caso saltiamo i controlli di ruolo.
    if (targetMember) {
        
        // Controllo 1: Il BOT può bannarlo?
        if (!targetMember.bannable) {
            return interaction.editReply({ 
                content: "⛔ **Errore:** Il mio ruolo è inferiore a quello dell'utente. Sposta il ruolo del Bot più in alto nella lista ruoli del server!" 
            });
        }

        // Controllo 2: Gerarchia Staff vs Utente
        // Se chi esegue il comando NON è il proprietario del server, facciamo il controllo.
        if (interaction.guild.ownerId !== executor.id) {
            if (executorMember.roles.highest.position <= targetMember.roles.highest.position) {
                return interaction.editReply({ 
                    content: `⛔ **Gerarchia:** Non puoi bannare ${targetUser.tag}.\nIl suo ruolo (${targetMember.roles.highest.name}) è uguale o superiore al tuo (${executorMember.roles.highest.name}).` 
                });
            }
        }
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
        // Esegue il ban. Se targetMember esiste usiamo quello, altrimenti usiamo l'ID (per utenti fuori dal server)
        await interaction.guild.members.ban(targetUser.id, { 
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
        await interaction.editReply({ content: "❌ C'è stato un errore imprevisto durante il ban (Controlla che l'utente non sia già bannato)." });
    }
  }
};
