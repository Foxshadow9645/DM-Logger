import Ticket from "../core/models/Ticket.js";
import { EmbedBuilder } from "discord.js";

// Lista di TUTTI i ruoli autorizzati a reclamare
const ALLOWED_CLAIM_ROLES = [
  "1413141862906331176", // Holder
  "1429034156326912124", // Founder
  "1429034157467635802", // CEO
  "1429034166229663826", // Executive
  "1429034167781294080", // Director
  "1434591845370957875", // PARTNERSHIP (Ora può reclamare!)
  "1429034175171792988", // Head Admin
  "1429034176014843944", // Admin
  "1429034177000509451", // Management Mod
  "1429034177898086491", // Head Mod
  "1429034178766180444", // Mod
  "1429034179747778560", // Helper
  "1431283077824512112"  // Trial Helper
];

export default function staffClaim(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    const { customId, guild, member } = interaction;

    if (customId.startsWith("claim_")) {
      const channelId = customId.replace("claim_", "");
      const channel = guild.channels.cache.get(channelId);
      
      if (!channel) return interaction.reply({ content: "❌ Canale non trovato.", ephemeral: true });

      // Controllo se l'utente ha uno dei ruoli permessi
      const hasPermission = member.roles.cache.some(role => ALLOWED_CLAIM_ROLES.includes(role.id));

      if (!hasPermission) {
        return interaction.reply({ content: "❌ Non hai il grado necessario per reclamare questo ticket.", ephemeral: true });
      }

      await channel.permissionOverwrites.edit(member.id, {
        ViewChannel: true, SendMessages: true, ReadMessageHistory: true
      });

      await Ticket.findOneAndUpdate({ channelId }, { claimed: true, staffId: member.id });

      const claimEmbed = new EmbedBuilder()
        .setColor("#10b981")
        .setDescription(`🟢 **L'operatore <@${member.id}> ha preso in carico la richiesta.**`);

      await channel.send({ embeds: [claimEmbed] });
      return interaction.reply({ content: `✅ Ticket reclamato.`, ephemeral: true });
    }
  });

  // Track se operatore esce
  client.on("channelUpdate", async (oldChannel, newChannel) => {
    if (!newChannel.name.startsWith("ticket-")) return;
    const ticket = await Ticket.findOne({ channelId: newChannel.id });
    if (!ticket || !ticket.claimed || !ticket.staffId) return;

    const hasAccess = newChannel.permissionsFor(ticket.staffId)?.has("ViewChannel");
    if (!hasAccess) {
        await newChannel.send({ embeds: [new EmbedBuilder().setColor("#facc15").setDescription(`⚠️ L'operatore <@${ticket.staffId}> ha lasciato il ticket.`)]});
        await Ticket.findOneAndUpdate({ channelId: newChannel.id }, { claimed: false, staffId: null });
    }
  });
}
