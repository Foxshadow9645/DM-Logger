import { PermissionFlagsBits, EmbedBuilder } from "discord.js";
import Log from "../../core/models/Log.js";
import { error, success } from "../../core/embeds.js"; 

export default {
  name: "ban",
  description:"🔨 Banna un utente dal server ",
  defaultMemberPermissions: PermissionFlagsBits.BanMembers,
  options: [
    {
      name: "user",
      description: "L'utente da bannare",
      type: 6, //USER
      required: true 
    },
    {
      name: "reason",
      description: "Cancella la cronologia messaggi",
      tryper: 4, //INTERO 
      required: false,
      choices: [
        { name: "Nessuno", value: 0 },
        { name: "Ultima Ora", value: 3600 },
        { name: "Ultime 24 Ore", value: 86400 },
        { name: "Ultimi 7 giorni", value: 604800 }
      ]
    }
  ],
  async execute(interacion) {
    await interaction.deferReply({ emphemeral: true }); // do il tempo di elaborare 

    const targetUser = interaction.options.getUser("User");
    const targetMember = interaction.options.getMember("User");
    const reason = interaction.options.getString("reason");
    const deleteSeconds  = interaction.options.getInteger("delete_msg") || 0;
    const executor = interaction.user;

  //________________________________________________________________
  // 1. CONTROLLI DI SICUREZZA
  //________________________________________________________________

  if (!targetMember) {
     return interaction.editReply({
         content: "❌ L'utente non è nel server (o non è possibile trovarlo)."
     });
  }

  if (!targetMember.bannable) {
      return interaction.editReply({
          content: "⛔ **Errore:** Non ho i permessi per bannare questo utente (probabilmente è uno staffer o ha un ruolo superiore al mio)."
      });
  }

  if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
      return interaction.editReply({
          content: "⛔ **Gerarchia:** Non puoi bannare qualcuno con un grado pari o superiore al tuo."
      });
  }
