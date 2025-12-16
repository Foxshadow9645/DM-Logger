import { 
    SlashCommandBuilder,
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    PermissionFlagsBits 
} from "discord.js";

// 🖼️ CONFIGURAZIONE ESTETICA
const BANNER_URL = "https://i.imgur.com/7wQ7W4V.gif"; // Banner GIF futuristica
const EMBED_COLOR = 0xFFD700; // Oro Militare

export default {
    // Definizione Slash Command
    data: new SlashCommandBuilder()
        .setName('setup-roles')
        .setDescription('Genera il pannello interattivo per i Self-Roles')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Solo Admin

    async execute(interaction) {
        // 1. Rispondiamo "di nascosto" all'admin per dire che stiamo lavorando
        await interaction.deferReply({ ephemeral: true });

        // 2. Creazione Embed (Stile Militare/Cyber)
        const embed = new EmbedBuilder()
            .setTitle("📡 CENTRO ASSEGNAZIONE RUOLI")
            .setDescription(
                "> *Benvenuto nel sistema di configurazione profilo.*\n" +
                "> *Seleziona una categoria dal menu sottostante per accedere ai protocolli specifici.*\n\n" +
                "**🗂️ CATEGORIE DISPONIBILI**\n" +
                "Seleziona una voce per espandere le opzioni:\n\n" +
                "👤 **Identità** » Imposta il tuo genere.\n" +
                "🔞 **Età** » Specifica la tua fascia d'età.\n" +
                "🎮 **Hobby** » Interessi e passatempi.\n" +
                "🎨 **Colori** » Personalizza il colore del tuo nome."
            )
            .setColor(EMBED_COLOR)
            .setImage(BANNER_URL)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setFooter({ 
                text: "DM REALM ALPHA // SYSTEM LOGISTICS", 
                iconURL: interaction.guild.iconURL({ dynamic: true }) 
            })
            .setTimestamp();

        // 3. Creazione Menu a Tendina
        // IMPORTANTE: Il customId 'roles_main_menu' deve combaciare con roleSelector.js
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('roles_main_menu') 
            .setPlaceholder('🔻 Seleziona una Categoria di Accesso')
            .addOptions([
                {
                    label: 'Identità e Genere',
                    description: 'Seleziona il tuo genere di appartenenza.',
                    value: 'category_gender',
                    emoji: '🚻'
                },
                {
                    label: 'Fascia d\'Età',
                    description: 'Seleziona la tua fascia d\'età anagrafica.',
                    value: 'category_age',
                    emoji: '🔞'
                },
                {
                    label: 'Interessi e Hobby',
                    description: 'Cosa ti piace fare? (Selezione Multipla).',
                    value: 'category_hobby',
                    emoji: '🎮'
                },
                {
                    label: 'Palette Colori',
                    description: 'Cambia il colore del tuo nickname.',
                    value: 'category_color',
                    emoji: '🎨'
                },
                {
                    label: 'Resetta Profilo',
                    description: 'Rimuove tutti i ruoli opzionali dal tuo profilo.',
                    value: 'category_reset',
                    emoji: '🗑️'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // 4. Invio del pannello nel canale (Visibile a tutti)
        await interaction.channel.send({ 
            embeds: [embed], 
            components: [row] 
        });

        // 5. Conferma all'admin (Visibile solo a te)
        await interaction.editReply("✅ **Pannello Ruoli generato con successo in questo canale!**");
    }
};
