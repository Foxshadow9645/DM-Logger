import { 
    Events, 
    ActionRowBuilder, 
    StringSelectMenuBuilder 
} from "discord.js";

// ─────────────────────────────────────────────
// ⚙️ CONFIGURAZIONE RUOLI E CATEGORIE
// ─────────────────────────────────────────────

// 1. GENERE (Esclusivi)
const GENDER_ROLES = {
    "1429034208206000198": { label: "Uomo", emoji: "♂" },
    "1429034209392988250": { label: "Donna", emoji: "♀" },
    "1429034210446020739": { label: "Non Binary", emoji: "⚧" }
};

// 2. ETÀ (Esclusivi)
const AGE_ROLES = {
    "1429034211334951032": { label: "+18 Maggiorenne", emoji: "🔞" },
    "1429034213163667496": { label: "-18 Minorenne", emoji: "🍼" }
};

// 3. HOBBY (Multipli) - Sostituisci gli ID quando li avrai
const HOBBY_ROLES = {
    "ID_GAMING_QUI": { label: "Videogames", emoji: "🎮" },
    "ID_MUSICA_QUI": { label: "Musica", emoji: "🎵" },
    "ID_TECH_QUI":   { label: "Tecnologia", emoji: "💻" },
    "ID_ANIME_QUI":  { label: "Anime & Manga", emoji: "⛩️" }
};

// 4. COLORI (Esclusivi)
const COLOR_ROLES = {
    "1450567333465555054": { label: "Cherry Red", emoji: "🍒" },
    "1450567334572982285": { label: "Blood Red", emoji: "🩸" },
    "1450567336259227739": { label: "Sunset Orange", emoji: "🔥" },
    "1450567338142208293": { label: "Golden Glow", emoji: "🌟" },
    "1450567339287511096": { label: "Antique Gold", emoji: "🏺" },
    "1450567340616978495": { label: "Cyber Yellow", emoji: "🍋" },
    "1450567342735101962": { label: "Mint Green", emoji: "🌿" },
    "1450567344257765520": { label: "Toxic Lime", emoji: "🐍" },
    "1450567345885151297": { label: "Deep Teal", emoji: "🦈" },
    "1450567347990696037": { label: "Cyan Diamond", emoji: "💎" },
    "1450567349227880549": { label: "Ocean Blue", emoji: "🌊" },
    "1450567350087717059": { label: "Deep Navy", emoji: "🌌" },
    "1450567352428265492": { label: "Magic Purple", emoji: "🔮" },
    "1450567353489166396": { label: "Neon Violet", emoji: "🦄" },
    "1450567361500549140": { label: "Lotus Lavender", emoji: "🪷" },
    "1450567362666299402": { label: "Pastel Pink", emoji: "🌸" },
    "1450567363828121620": { label: "Cotton Candy", emoji: "🍬" },
    "1450567365334007950": { label: "Pure White", emoji: "⚪" },
    "1450567366705549445": { label: "Silver Storm", emoji: "🌪️" },
    "1450567367737344095": { label: "Eclipse Grey", emoji: "🌚" },
};

// ─────────────────────────────────────────────
// 🧠 LOGICA DEL SISTEMA
// ─────────────────────────────────────────────

export default function(client) {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isStringSelectMenu()) return;

        const { customId, values, member } = interaction;

        // 🟢 FASE 1: MENU PRINCIPALE
        if (customId === 'roles_main_menu') {
            const selectedCategory = values[0];

            if (selectedCategory === 'category_gender') {
                await sendSubMenu(interaction, "Identità", "Seleziona la tua identità di genere.", GENDER_ROLES, 'sub_role_gender');
            }
            else if (selectedCategory === 'category_age') {
                await sendSubMenu(interaction, "Età Anagrafica", "Conferma la tua fascia d'età.", AGE_ROLES, 'sub_role_age');
            }
            else if (selectedCategory === 'category_hobby') {
                await sendSubMenu(interaction, "Interessi", "Cosa ti piace fare?", HOBBY_ROLES, 'sub_role_hobby', true);
            }
            else if (selectedCategory === 'category_color') {
                await sendSubMenu(interaction, "Palette Colori", "Scegli il colore del tuo nome.", COLOR_ROLES, 'sub_role_color');
            }
            else if (selectedCategory === 'category_reset') {
                await handleReset(interaction, member);
            }
        }

        // 🔵 FASE 2: GESTIONE SOTTOMENU
        else if (['sub_role_gender', 'sub_role_age', 'sub_role_color'].includes(customId)) {
            await handleExclusiveRole(interaction, member, customId, values[0]);
        }
        else if (customId === 'sub_role_hobby') {
            await handleMultipleRoles(interaction, member, values);
        }
    });
}

// 📦 FUNZIONI DI UTILITÀ

async function sendSubMenu(interaction, title, placeholder, roleList, menuId, isMulti = false) {
    const options = Object.entries(roleList)
        .filter(([id]) => id.length > 15 && !id.startsWith("ID_"))
        .map(([id, data]) => ({
            label: data.label,
            value: id,
            emoji: data.emoji
        }));

    if (options.length === 0) {
        return interaction.reply({ content: "⚠️ Questa categoria non è ancora configurata.", ephemeral: true });
    }

    const select = new StringSelectMenuBuilder()
        .setCustomId(menuId)
        .setPlaceholder(placeholder)
        .addOptions(options);

    if (isMulti) select.setMinValues(0).setMaxValues(options.length);

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.reply({
        content: `**📂 Categoria: ${title}**`,
        components: [row],
        ephemeral: true
    });
}

async function handleExclusiveRole(interaction, member, menuId, selectedRoleId) {
    await interaction.deferUpdate();

    let categoryRoles = {};
    if (menuId === 'sub_role_gender') categoryRoles = GENDER_ROLES;
    if (menuId === 'sub_role_age') categoryRoles = AGE_ROLES;
    if (menuId === 'sub_role_color') categoryRoles = COLOR_ROLES;

    const allCategoryIds = Object.keys(categoryRoles);
    const roleName = categoryRoles[selectedRoleId].label;

    try {
        // Rimuove altri ruoli della stessa categoria
        const toRemove = allCategoryIds.filter(id => id !== selectedRoleId && member.roles.cache.has(id));
        if (toRemove.length > 0) await member.roles.remove(toRemove);

        // Aggiunge il nuovo ruolo se non c'è già
        if (!member.roles.cache.has(selectedRoleId)) {
            await member.roles.add(selectedRoleId);
            await interaction.followUp({ content: `✅ Hai selezionato: **${roleName}**`, ephemeral: true });
        } else {
            await interaction.followUp({ content: `✅ Ruolo **${roleName}** già attivo.`, ephemeral: true });
        }
    } catch (error) {
        console.error(error);
        await interaction.followUp({ content: "❌ Errore permessi. Controlla che il ruolo del Bot sia sopra i ruoli colore.", ephemeral: true });
    }
}

async function handleMultipleRoles(interaction, member, selectedIds) {
    await interaction.deferUpdate();
    try {
        await member.roles.add(selectedIds);
        await interaction.followUp({ content: `✅ Interessi aggiornati!`, ephemeral: true });
    } catch (error) {
        await interaction.followUp({ content: "❌ Errore permessi.", ephemeral: true });
    }
}

async function handleReset(interaction, member) {
    await interaction.deferReply({ ephemeral: true });
    const allIds = [
        ...Object.keys(GENDER_ROLES),
        ...Object.keys(AGE_ROLES),
        ...Object.keys(HOBBY_ROLES),
        ...Object.keys(COLOR_ROLES)
    ].filter(id => id.length > 15 && !id.startsWith("ID_"));

    try {
        await member.roles.remove(allIds);
        await interaction.editReply("🗑️ **Profilo Resettato.**");
    } catch (error) {
        await interaction.editReply("❌ Errore durante il reset.");
    }
}
