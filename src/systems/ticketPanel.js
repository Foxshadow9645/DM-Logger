import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";

/**
 * Funzione per inviare un pannello ticket nel canale indicato.
 * Usata da /setup-ticket-panel
 */
export async function sendTicketPanel(channel) {
  const embed = new EmbedBuilder()
    .setTitle("🎟️ DM REALM ALPHA — Ticket Control Panel")
    .setDescription(
      "Seleziona la tipologia di assistenza richiesta.\n\n" +
      "⚔️ **High Staff** — Comunicazioni riservate con l'Alto Comando.\n" +
      "🤝 **Partnership** — Collaborazioni o richieste ufficiali.\n" +
      "🛠️ **Assistenza** — Problemi tecnici o supporto operativo."
    )
    .setColor("#1E3A8A")
    .setThumbnail(
      "https://media.discordapp.net/attachments/873126567134494742/1429862125177667594/file_000000002ab86246b8dd9f8e630d018f.jpg"
    )
    .setFooter({
      text: "Nihil Difficile Volenti • Sistema Ticket DM REALM ALPHA"
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_highstaff")
      .setLabel("⚔️ High Staff")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("ticket_partnership")
      .setLabel("🤝 Partnership")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("ticket_assistenza")
      .setLabel("🛠️ Assistenza")
      .setStyle(ButtonStyle.Secondary)
  );

  await channel.send({ embeds: [embed], components: [row] });
}

