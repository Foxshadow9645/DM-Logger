import { ChannelType } from "discord.js";

export default {
  name: "map",
  description: "Mappa l'intera struttura del server nella console",
  async execute(interaction) {
    await interaction.reply({ content: "Sto mappando il server... Controlla la console (il terminale)!", ephemeral: true });

    const guild = interaction.guild;
    
    // Recupera tutti i canali
    const channels = await guild.channels.fetch();
    
    // Filtra solo le categorie
    const categories = channels.filter(c => c && c.type === ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
    
    // Filtra i canali senza categoria
    const noCategory = channels.filter(c => c && c.parentId === null && c.type !== ChannelType.GuildCategory);

    let output = `\n--- 🗺️ MAPPA DEL SERVER: ${guild.name} ---\n`;

    // 1. Stampa canali senza categoria
    if (noCategory.size > 0) {
      output += "\n[SENZA CATEGORIA]\n";
      noCategory.forEach(c => {
        output += `   # ${c.name} (ID: ${c.id})\n`;
      });
    }

    // 2. Stampa categorie e i loro canali
    categories.forEach(cat => {
      output += `\n📁 ${cat.name.toUpperCase()} (ID: ${cat.id})\n`;
      
      // Prendi i canali figli di questa categoria
      const children = channels.filter(c => c && c.parentId === cat.id).sort((a, b) => a.position - b.position);
      
      children.forEach(child => {
        output += `   - ${child.name} (ID: ${child.id})\n`;
      });
    });

    output += "\n--- FINE MAPPA ---\n";

    // Stampa tutto nel terminale
    console.log(output);
  }
};
