import { PermissionFlagsBits } from "discord.js";

export default {
    name: 'map',
    description: 'Ottieni la lista di tutti i ruoli e ID per la configurazione',
    async execute(message, args) {
        // Controllo permessi aggiornato per Discord.js v14
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Non hai il permesso di usare questo comando.");
        }

        // Recupera i ruoli, rimuove @everyone e li ordina per posizione (dall'alto in basso)
        let ruoli = message.guild.roles.cache
            .filter(r => r.name !== '@everyone')
            .sort((a, b) => b.position - a.position);

        let output = "";
        
        // Formatta come: "Nome Ruolo": "ID",
        ruoli.forEach(role => {
            output += `"${role.name}": "${role.id}",\n`;
        });

        // Se non ci sono ruoli (improbabile), avvisa
        if (output.length === 0) {
            return message.reply("⚠️ Non ho trovato nessun ruolo oltre a @everyone.");
        }

        // Divide il messaggio in pezzi da 1900 caratteri per evitare il limite di Discord
        const chunks = output.match(/[\s\S]{1,1900}/g) || [];

        await message.reply("📝 **Ecco la mappa dei ruoli del server.**\nCopia il contenuto del blocco qui sotto e inviamelo per configurare il menu.");

        for (const chunk of chunks) {
            // Usa il blocco di codice 'json' per una colorazione chiara
            await message.channel.send(`\`\`\`json\n${chunk}\n\`\`\``);
        }
    }
};
