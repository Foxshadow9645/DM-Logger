// src/commands/tickets/setupTicketPanel.js
import { PermissionFlagsBits } from "discord.js";
import { sendTicketPanel } from "../../systems/ticketPanel.js";

export default {
  name: "setup-ticket-panel",
  description: "Crea il pannello per aprire i ticket",
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  async execute(interaction) {
    try {
      await sendTicketPanel(interaction.channel);
      await interaction.reply({ content: "✅ Pannello ticket creato!", ephemeral: true });
    } catch (err) {
      console.error("Errore setupTicketPanel:", err.message);
      await interaction.reply({ content: "❌ Errore nella creazione del pannello.", ephemeral: true });
    }
  }
};

