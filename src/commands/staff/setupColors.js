import { PermissionFlagsBits } from "discord.js";

// 🎨 LISTA DEI 20 COLORI (GRADIENTI & AESTHETIC)
const COLORS_TO_CREATE = [
    // --- ROSSI & ARANCIO ---
    { name: "🍒・Cherry Red", hex: "#FF0055" },
    { name: "🩸・Blood Red", hex: "#8B0000" },     // NUOVO: Rosso scuro intenso
    { name: "🔥・Sunset Orange", hex: "#FF5500" },
    
    // --- GIALLI & ORO ---
    { name: "🌟・Golden Glow", hex: "#FFAA00" },
    { name: "🏺・Antique Gold", hex: "#CFB53B" },  // NUOVO: Oro antico elegante
    { name: "🍋・Cyber Yellow", hex: "#FFFF00" },

    // --- VERDI ---
    { name: "🌿・Mint Green", hex: "#55FF55" },
    { name: "🐍・Toxic Lime", hex: "#AAFF00" },
    { name: "🦈・Deep Teal", hex: "#008080" },     // NUOVO: Verde acqua scuro professionale

    // --- BLU & AZZURRI ---
    { name: "💎・Cyan Diamond", hex: "#00FFFF" },
    { name: "🌊・Ocean Blue", hex: "#00AAFF" },
    { name: "🌌・Deep Navy", hex: "#0055FF" },

    // --- VIOLA & ROSA ---
    { name: "🔮・Magic Purple", hex: "#5500FF" },
    { name: "🦄・Neon Violet", hex: "#AA00FF" },
    { name: "🪷・Lotus Lavender", hex: "#E6E6FA" }, // NUOVO: Lavanda chiarissimo
    { name: "🌸・Pastel Pink", hex: "#FF55FF" },
    { name: "🍬・Cotton Candy", hex: "#FFAAFF" },

    // --- NEUTRI & MONOCROMATICI ---
    { name: "⚪・Pure White", hex: "#FFFFFF" },
    { name: "🌪️・Silver Storm", hex: "#C0C0C0" },  // NUOVO: Argento metallico
    { name: "🌚・Eclipse Grey", hex: "#2F3136" }  // Grigio scuro discord
];

export default {
    name: 'setup-colors',
    description: 'Crea automaticamente 20 ruoli colore e restituisce la configurazione.',
    async execute(message, args) {
        // 🛡️ Sicurezza
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ **Accesso Negato.**");
        }

        const statusMsg = await message.reply("🎨 **Inizio creazione dei ruoli colore...** Attendi qualche secondo.");
        
        let configOutput = "// 4. COLORI (Copia questo blocco in roleSelector.js)\nconst COLOR_ROLES = {\n";
        let createdCount = 0;
        let foundCount = 0;

        try {
            for (const color of COLORS_TO_CREATE) {
                // Controlla se il ruolo esiste già per evitare duplicati
                let role = message.guild.roles.cache.find(r => r.name === color.name);

                if (!role) {
                    // Crea il ruolo se non esiste
                    role = await message.guild.roles.create({
                        name: color.name,
                        color: color.hex,
                        reason: "Setup Automatico Colori DM Logger",
                        permissions: [] // NESSUN PERMESSO, SOLO COLORE
                    });
                    createdCount++;
                } else {
                    foundCount++;
                }

                // Aggiungi alla stringa di configurazione
                const emoji = color.name.split("・")[0]; // Prende l'emoji dal nome
                const label = color.name.split("・")[1]; // Prende il nome pulito
                
                configOutput += `    "${role.id}": { label: "${label}", emoji: "${emoji}" },\n`;
            }

            configOutput += "};";

            // Invia il risultato
            await statusMsg.edit(`✅ **Operazione completata!**\n🆕 Creati: **${createdCount}**\n🔎 Trovati esistenti: **${foundCount}**\n\n👇 **Copia il codice qui sotto e sostituiscilo nella sezione COLOR_ROLES di \`src/systems/roleSelector.js\`**`);
            await message.channel.send(`\`\`\`javascript\n${configOutput}\n\`\`\``);

        } catch (error) {
            console.error(error);
            await message.channel.send("❌ C'è stato un errore durante la creazione dei ruoli. Controlla la console.");
        }
    }
};
