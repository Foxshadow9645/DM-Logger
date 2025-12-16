import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

// 🎨 LISTA DEI 20 COLORI (GRADIENTI & AESTHETIC)
const COLORS_TO_CREATE = [
    // --- ROSSI & ARANCIO ---
    { name: "🍒・Cherry Red", hex: "#FF0055" },
    { name: "🩸・Blood Red", hex: "#8B0000" },
    { name: "🔥・Sunset Orange", hex: "#FF5500" },
    
    // --- GIALLI & ORO ---
    { name: "🌟・Golden Glow", hex: "#FFAA00" },
    { name: "🏺・Antique Gold", hex: "#CFB53B" },
    { name: "🍋・Cyber Yellow", hex: "#FFFF00" },

    // --- VERDI ---
    { name: "🌿・Mint Green", hex: "#55FF55" },
    { name: "🐍・Toxic Lime", hex: "#AAFF00" },
    { name: "🦈・Deep Teal", hex: "#008080" },

    // --- BLU & AZZURRI ---
    { name: "💎・Cyan Diamond", hex: "#00FFFF" },
    { name: "🌊・Ocean Blue", hex: "#00AAFF" },
    { name: "🌌・Deep Navy", hex: "#0055FF" },

    // --- VIOLA & ROSA ---
    { name: "🔮・Magic Purple", hex: "#5500FF" },
    { name: "🦄・Neon Violet", hex: "#AA00FF" },
    { name: "🪷・Lotus Lavender", hex: "#E6E6FA" },
    { name: "🌸・Pastel Pink", hex: "#FF55FF" },
    { name: "🍬・Cotton Candy", hex: "#FFAAFF" },

    // --- NEUTRI & MONOCROMATICI ---
    { name: "⚪・Pure White", hex: "#FFFFFF" },
    { name: "🌪️・Silver Storm", hex: "#C0C0C0" },
    { name: "🌚・Eclipse Grey", hex: "#2F3136" }
];

export default {
    // Definizione dello Slash Command
    data: new SlashCommandBuilder()
        .setName('setup-colors')
        .setDescription('Crea automaticamente 20 ruoli colore e restituisce la configurazione.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // 🛡️ Visibile solo agli Admin

    async execute(interaction) {
        // Usiamo deferReply perché creare 20 ruoli potrebbe richiedere più di 3 secondi
        await interaction.deferReply({ ephemeral: false });

        let configOutput = "// 4. COLORI (Copia questo blocco in roleSelector.js)\nconst COLOR_ROLES = {\n";
        let createdCount = 0;
        let foundCount = 0;

        try {
            const guild = interaction.guild;

            for (const color of COLORS_TO_CREATE) {
                // Controlla se il ruolo esiste già
                let role = guild.roles.cache.find(r => r.name === color.name);

                if (!role) {
                    role = await guild.roles.create({
                        name: color.name,
                        color: color.hex,
                        reason: "Setup Automatico Colori DM Logger",
                        permissions: [] // Nessun permesso, solo estetico
                    });
                    createdCount++;
                } else {
                    foundCount++;
                }

                // Costruiamo la stringa di configurazione
                const emoji = color.name.split("・")[0]; 
                const label = color.name.split("・")[1]; 
                
                configOutput += `    "${role.id}": { label: "${label}", emoji: "${emoji}" },\n`;
            }

            configOutput += "};";

            // Modifichiamo la risposta iniziale con il risultato
            await interaction.editReply({
                content: `✅ **Setup Completato!**\n🆕 Creati: **${createdCount}**\n🔎 Trovati: **${foundCount}**\n\n👇 **Copia il codice qui sotto in \`src/systems/roleSelector.js\`**`
            });
            
            // Inviamo il blocco di codice in un messaggio separato per facilitare la copia
            await interaction.channel.send(`\`\`\`javascript\n${configOutput}\n\`\`\``);

        } catch (error) {
            console.error(error);
            await interaction.editReply("❌ Errore durante la creazione dei ruoli. Controlla la console.");
        }
    }
};
