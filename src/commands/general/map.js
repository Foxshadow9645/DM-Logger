import { ChannelType } from "discord.js";

module.exports = {
    name: 'map',
    description: 'Ottieni la lista di tutti i ruoli e ID per la configurazione',
    async execute(message, args) {
        // Controlla se l'utente è amministratore per sicurezza
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply("❌ Non hai il permesso di usare questo comando.");
        }

        let ruoli = message.guild.roles.cache
            .filter(r => r.name !== '@everyone') // Rimuoviamo @everyone
            .sort((a, b) => b.position - a.position); // Ordiniamo per importanza (gerarchia)

        // Creiamo una lista formattata
        // Esempio output: "Nome Ruolo": 1234567890,
        let output = "";
        
        ruoli.forEach(role => {
            output += `"${role.name}": ${role.id},\n`;
        });

        // Discord ha un limite di 2000 caratteri per messaggio.
        // Se la lista è lunga, la dividiamo in più pezzi.
        const chunks = output.match(/[\s\S]{1,1900}/g) || [];

        await message.reply("📝 **Ecco la lista dei ruoli e ID del server:**\nCopia le righe che ti servono nella configurazione.");

        for (const chunk of chunks) {
            await message.channel.send(`\`\`\`json\n${chunk}\n\`\`\``);
        }
    }
};
