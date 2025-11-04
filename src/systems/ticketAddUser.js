import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from "discord.js";
import Ticket from "../core/models/Ticket.js";

const STAFF_ROLES = [
  "1429034166229663826","1429034167781294080","1429034175171792988",
  "1429034176014843944","1429034177000509451","1429034177898086491",
  "1429034178766180444","1429034179747778560","1431283077824512112"
];

export default function ticketAddUser(client) {

  // 🔘 CLICK SU "Aggiungi Utente"
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "ticket_add_user") return;

    // Solo staff può usarlo
    if (!STAFF_ROLES.some(r => interaction.member.roles.cache.has(r)))
      return interaction.reply({ content: "❌ Non sei autorizzato.", ephemeral: true });

    const modal = new ModalBuilder()
      .setCustomId("modal_add_user")
      .setTitle("➕ Aggiungi Utente al Ticket");

    const userInput = new TextInputBuilder()
      .setCustomId("user_to_add")
      .setLabel("Inserisci @utente o ID")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("@Username oppure 123456789012345678")
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(userInput));
    return interaction.showModal(modal);
  });

  // 📝 GESTIONE RISPOSTA DEL MODAL
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== "modal_add_user") return;

    const userText = interaction.fields.getTextInputValue("user_to_add").replace(/[<@>]/g, "");

    const guild = interaction.guild;
    const channel = interaction.channel;
    const ticket = await Ticket.findOne({ channelId: channel.id });
    if (!ticket) return;

    let targetUser;
    try {
      targetUser = await guild.members.fetch(userText);
    } catch {
      return interaction.reply({ content: "❌ Utente non trovato.", ephemeral: true });
    }

    // Aggiunge permessi
    await channel.permissionOverwrites.edit(targetUser.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });

    // Messaggio in chat
    const embed = new EmbedBuilder()
      .setColor("#3b82f6")
      .setDescription(`➕ **<@${targetUser.id}> è stato aggiunto alla conversazione da <@${interaction.user.id}>.**`)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    return interaction.reply({ content: "✅ Utente aggiunto.", ephemeral: true });
  });
}
