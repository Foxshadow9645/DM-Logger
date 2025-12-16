import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, AttachmentBuilder } from "discord.js";
import { createTranscript } from "discord-html-transcripts"; 
import Ticket from "../core/models/Ticket.js";

// Canale Log dove salvare i transcript
const TRANSCRIPT_LOG_CHANNEL = "1435294808045256704";

export default function ticketClose(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    // ─────────────────────────────────────────────
    // 1. PULSANTE CHIUSURA (Chiede conferma)
    // ─────────────────────────────────────────────
    if (interaction.customId === "ticket_close") {
      const confirmEmbed = new EmbedBuilder()
        .setColor("#e74c3c")
        .setTitle("🔒 Conferma Chiusura")
        .setDescription("Vuoi chiudere il ticket?\nTi invierò una copia della chat (HTML e Testo).");

      const rows = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("confirm_close").setLabel("✅ Conferma e Chiudi").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("cancel_close").setLabel("Annulla").setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ 
          embeds: [confirmEmbed], 
          components: [rows], 
          flags: MessageFlags.Ephemeral 
      });
    }

    // ─────────────────────────────────────────────
    // 2. CONFERMA (Esecuzione)
    // ─────────────────────────────────────────────
    if (interaction.customId === "confirm_close") {
      const channel = interaction.channel;
      const guild = interaction.guild;

      await interaction.update({ 
          content: "⏳ **Generazione transcript (HTML + TXT) e invio in corso...**", 
          components: [], 
          embeds: [] 
      });

      // Eseguiamo la chiusura
      await performClose(client, channel, guild, interaction.user);
    }
  });
}

// ─────────────────────────────────────────────
// 🛠️ FUNZIONE GENERAZIONE FILE TXT (Leggero per Mobile)
// ─────────────────────────────────────────────
async function generateTxtTranscript(channel) {
    try {
        // Scarica gli ultimi 100 messaggi (Discord ha dei limiti, 100 è sicuro e veloce)
        const messages = await channel.messages.fetch({ limit: 100 });
        const orderedMessages = Array.from(messages.values()).reverse(); // Ordina dal più vecchio al più nuovo

        let textOutput = `TRANSCRIPT: ${channel.name}\n`;
        textOutput += `DATA: ${new Date().toLocaleString('it-IT')}\n`;
        textOutput += `--------------------------------------------------\n\n`;

        orderedMessages.forEach(msg => {
            const time = msg.createdAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            const author = msg.author.tag;
            const content = msg.content || "[Contenuto Multimediale / Embed]";
            
            textOutput += `[${time}] ${author}: ${content}\n`;
            
            // Se ci sono allegati (immagini), mette il link
            if (msg.attachments.size > 0) {
                textOutput += `       [Allegato]: ${msg.attachments.first().url}\n`;
            }
        });

        return new AttachmentBuilder(Buffer.from(textOutput), { name: `${channel.name}.txt` });
    } catch (e) {
        console.error("Errore generazione TXT:", e);
        return null;
    }
}

// ─────────────────────────────────────────────
// 🛠️ FUNZIONE DI CHIUSURA CONDIVISA
// ─────────────────────────────────────────────
export async function performClose(client, channel, guild, executor) {
    // 1. Recupera Dati
    const ticket = await Ticket.findOne({ channelId: channel.id });
    const ticketOwnerId = ticket ? ticket.userId : null;
    const ticketType = ticket ? ticket.type : "Generico";

    // 2. Genera Transcript HTML (Bello, per PC)
    let attachmentHtml;
    try {
      attachmentHtml = await createTranscript(channel, {
        limit: -1,
        returnType: 'attachment',
        fileName: `${channel.name}.html`,
        minify: true,
        saveImages: true,
        footerText: "Exported by DM Realm Alpha",
        poweredBy: false
      });
    } catch (err) { console.error(err); }

    // 3. Genera Transcript TXT (Veloce, per Mobile)
    const attachmentTxt = await generateTxtTranscript(channel);

    // Mettiamo i file validi in una lista
    const filesToSend = [];
    if (attachmentHtml) filesToSend.push(attachmentHtml);
    if (attachmentTxt) filesToSend.push(attachmentTxt);

    // 4. INVIO ALL'UTENTE (DM)
    if (ticketOwnerId && filesToSend.length > 0) {
        try {
            const user = await client.users.fetch(ticketOwnerId);
            const userEmbed = new EmbedBuilder()
                .setColor("#3b82f6")
                .setTitle("Ticket Chiuso")
                .setDescription(
                    `Il tuo ticket è stato chiuso.\n\n` +
                    `📱 **Da cellulare:** Apri il file **.txt** per leggere subito.\n` +
                    `💻 **Da PC:** Scarica il file **.html** per vedere colori e immagini.`
                );
            
            await user.send({ embeds: [userEmbed], files: filesToSend });
        } catch (e) {
            console.log(`Impossibile inviare DM a ${ticketOwnerId}`);
        }
    }

    // 5. INVIO ALLO STAFF (Log Channel)
    const logChannel = guild.channels.cache.get(TRANSCRIPT_LOG_CHANNEL);
    if (logChannel && filesToSend.length > 0) {
        const logEmbed = new EmbedBuilder()
          .setColor("#e74c3c")
          .setTitle("📕 Ticket Archiviato")
          .addFields(
            { name: "Ticket", value: channel.name, inline: true },
            { name: "Utente", value: ticketOwnerId ? `<@${ticketOwnerId}>` : "N/A", inline: true },
            { name: "Chiuso da", value: executor ? `<@${executor.id}>` : "🤖 AI System", inline: true },
            { name: "Categoria", value: ticketType, inline: true }
          )
          .setFooter({ text: "Inclusi formati HTML (Full) e TXT (Mobile)" })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed], files: filesToSend });
    }

    // 6. CANCELLAZIONE
    await Ticket.findOneAndUpdate({ channelId: channel.id }, { status: "closed" });
    setTimeout(() => { channel.delete().catch(() => {}); }, 5000);
}
