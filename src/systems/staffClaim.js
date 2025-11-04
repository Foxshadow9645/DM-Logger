import Ticket from "../core/models/Ticket.js";

const STAFF_ROLES = [
  "1429034166229663826","1429034167781294080","1429034175171792988",
  "1429034176014843944","1429034177000509451","1429034177898086491",
  "1429034178766180444","1429034179747778560","1431283077824512112"
];

export default function staffClaim(client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    const { customId, guild, member } = interaction;

    // RECLAMA TICKET
    if (customId.startsWith("claim_")) {
      const channelId = customId.replace("claim_", "");
      const channel = guild.channels.cache.get(channelId);
      if (!channel) return;

      // Solo Staff può reclamare
      if (!STAFF_ROLES.some(r => member.roles.cache.has(r)))
        return interaction.reply({ content: "❌ Non sei autorizzato.", ephemeral: true });

      // Permessi per lo staff nel ticket
      await channel.permissionOverwrites.edit(member.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });

      // Registra chi lo ha reclamato
      await Ticket.findOneAndUpdate({ channelId }, { claimed: true, staffId: member.id });

      // Messaggio nel ticket
      await channel.send(`🟢 **L'operatore <@${member.id}> ha preso in carico la conversazione.**`);

      return interaction.reply({ content: "✅ Ticket reclamato correttamente.", ephemeral: true });
    }
  });

  // 🔍 TRACK OPERATORE SE LASCIA
  client.on("channelUpdate", async (oldChannel, newChannel) => {
    if (!newChannel.name.startsWith("ticket-")) return;

    const ticket = await Ticket.findOne({ channelId: newChannel.id });
    if (!ticket || !ticket.claimed || !ticket.staffId) return;

    const staffMember = await newChannel.guild.members.fetch(ticket.staffId).catch(() => null);
    if (!staffMember) return;

    const hasAccess = newChannel.permissionsFor(ticket.staffId)?.has("ViewChannel");

    if (!hasAccess) {
  await newChannel.send({
    embeds: [
      new EmbedBuilder()
        .setColor("#facc15")
        .setTitle("🔕 Operatore non più presente")
        .setDescription(
          `L'operatore <@${ticket.staffId}> ha lasciato la conversazione.\n\n` +
          `🟡 Il ticket è ora **in attesa di un nuovo operatore**.\n` +
          `Se necessiti assistenza immediata, scrivi:\n` +
          `**voglio parlare con uno staffer** per richiedere di nuovo assegnazione.`
        )
        .setTimestamp()
    ]
  });

  await Ticket.findOneAndUpdate(
    { channelId: newChannel.id },
    { claimed: false, staffId: null }
  );
}

  });
}
