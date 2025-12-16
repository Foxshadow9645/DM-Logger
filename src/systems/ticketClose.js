import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { createTranscript } from "discord-html-transcripts"; // Libreria per chat HTML
import Ticket from "../core/models/Ticket.js";

// Canale Log dove salvare i transcript (Chat salvate)
const TRANSCRIPT_LOG_CHANNEL = "1435285738185953390";

export default function ticketClose(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    // ─────────────────────────────────────────────
    // 1. QUANDO PREMI "CHIUDI TICKET" (Richiesta Conferma)
    // ─────────────────────────────────────────────
    if (interaction.customId === "ticket_close") {
      
      const confirmEmbed = new EmbedBuilder()
        .setColor("#e74c3c") // Rosso
        .setTitle("🔒 Conferma Chiusura")
        .setDescription("Sei sicuro di voler chiudere il ticket?\nVerrà generato un transcript (copia della chat).");

      const rows = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("confirm_close").setLabel("✅ Conferma").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("cancel_close").setLabel("Annulla").setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ embeds: [confirmEmbed], components: [rows] });
    }

    // ─────────────────────────────────────────────
    // 2. QUANDO PREMI "CONFERMA" (Esecuzione Reale)
    // ─────────────────────────────────────────────
    if (interaction.customId === "confirm_close") {
      const channel = interaction.channel;
      const guild = interaction.guild;

      // 1. Avvisa che sta lavorando (evita doppi click)
      await interaction.update({ content: "⏳ **Sto salvando la chat e chiudendo...**", components: [], embeds: [] });

      // 2. Recupera info dal Database
      const ticket = await Ticket.findOne({ channelId: channel.id });
      const ticketOwnerId = ticket ? ticket.userId : "Sconosciuto";
      const ticketType = ticket ? ticket.type : "Generico";

      // 3. GENERA IL TRANSCRIPT (File HTML)
      let transcriptFile;
      try {
        transcriptFile = await createTranscript(channel, {
          limit: -1, // Salva TUTTI i messaggi
          returnType: 'attachment',
          fileName: `${channel.name}.html`, // Nome del file
          minify: true,
          saveImages: true, // Salva anche le immagini inviate
          footerText: "Exported by DM Realm Alpha",
          poweredBy: false
        });
      } catch (err) {
        console.error("Errore Transcript:", err);
        await channel.send("⚠️ Non sono riuscito a generare il file della chat, ma chiudo comunque.");
      }

      // 4. MANDA IL FILE AL CANALE LOG STAFF
      const logChannel = guild.channels.cache.get(TRANSCRIPT_LOG_CHANNEL);
      if (logChannel && transcriptFile) {
        const logEmbed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setTitle("📕 Ticket Chiuso")
          .addFields(
            { name: "Canale", value: channel.name, inline: true },
            { name: "Proprietario", value: `<@${ticketOwnerId}>`, inline: true },
            { name: "Chiuso da", value: `<@${interaction.user.id}>`, inline: true },
            { name: "Tipo", value: ticketType, inline: true }
          )
          .setTimestamp();

        await logChannel.send({ 
            content: `Ecco il transcript di **${channel.name}**:`,
            embeds: [logEmbed], 
            files: [transcriptFile] 
        });
      }

      // 5. MANDA IL FILE ALL'UTENTE (IN DM)
      if (transcriptFile && ticketOwnerId !== "Sconosciuto") {
        try {
          const user = await client.users.fetch(ticketOwnerId);
          await user.send({
            content: `Il tuo ticket in **${guild.name}** è stato chiuso. Ecco una copia della conversazione:`,
            files: [transcriptFile]
          });
        } catch (e) {
          // Se l'utente ha i DM chiusi, pazienza.
        }
      }

      // 6. CANCELLA IL CANALE (Dopo 5 secondi)
      await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed" });
      
      setTimeout(() => {
        channel.delete().catch(() => {});
      }, 5000);
    }

    // ─────────────────────────────────────────────
    // 3. ANNULLA CHIUSURA
    // ─────────────────────────────────────────────
    if (interaction.customId === "cancel_close") {
      await interaction.message.delete().catch(() => {});
    }
  });
}
