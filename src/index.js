// ─────────────────────────────────────────────
// 📦 IMPORTAZIONI PRINCIPALI
// ─────────────────────────────────────────────
import dotenv from "dotenv";
dotenv.config();

import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection
} from "discord.js";
import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────
// 🔧 CORE E DATABASE
// ─────────────────────────────────────────────
import { connectDatabase } from "./core/database.js";
import { testAILocal } from "./ai/setup-ai.js";

// ─────────────────────────────────────────────
// ⚙️ HANDLERS LOGGER CLASSICI
// ─────────────────────────────────────────────
import memberHandler from "./handlers/members.js";
import messageHandler from "./handlers/messages.js";
import moderationHandler from "./handlers/moderation.js";
import roleHandler from "./handlers/roles.js";
import voiceHandler from "./handlers/voice.js";
import inviteHandler from "./handlers/invites.js";

// ─────────────────────────────────────────────
// 🧠 SISTEMI AVANZATI
// ─────────────────────────────────────────────
import ticketSystem from "./systems/ticketSystem.js";
import aiListener from "./systems/aiListener.js";
import autoSecurity from "./systems/autoSecurity.js";

// ─────────────────────────────────────────────
// 🧠 AUTO DEPLOY COMANDI
// ─────────────────────────────────────────────
import { REST, Routes } from "discord.js";

async function autoDeployCommands(client) {
  const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
  if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.warn("⚠️ [AUTO-DEPLOY] Variabili mancanti: DISCORD_TOKEN o CLIENT_ID o GUILD_ID");
    return;
  }

  const commands = [];
  const foldersPath = path.resolve("src/commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
      try {
        const filePath = path.join(commandsPath, file);
        const command = (await import(filePath)).default;
        if (command?.name && command?.description) {
          commands.push({
            name: command.name,
            description: command.description,
            options: command.options || []
          });
        } else {
          console.warn(`⚠️ [AUTO-DEPLOY] Comando non valido: ${folder}/${file}`);
        }
      } catch (err) {
        console.error(`❌ [AUTO-DEPLOY] Errore importando comando ${folder}/${file}:`, err);
      }
    }
  }

  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

  try {
    console.log("🌍 [AUTO-DEPLOY] Registrazione comandi globali...");
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`✅ [AUTO-DEPLOY] ${commands.length} comandi globali registrati.`);

    console.log("⚡ [AUTO-DEPLOY] Registrazione comandi nella guild...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`✅ [AUTO-DEPLOY] Comandi resi disponibili immediatamente nella guild ${GUILD_ID}.`);

    console.log("🧩 [AUTO-DEPLOY] Sincronizzazione comandi completata.");
  } catch (error) {
    console.error("❌ [AUTO-DEPLOY] Errore durante la sincronizzazione dei comandi:", error);
  }
}

// Funzione check comandi caricati
async function checkCommandsLoaded(client) {
  const { CLIENT_ID } = process.env;
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  try {
    const data = await rest.get(Routes.applicationCommands(CLIENT_ID));
    console.log(`🔍 [CHECK] ${data.length} comandi globali attivi.`);
    // Puoi aggiungere ulteriori logiche, es: confrontare lista file comandi con data.length
  } catch (error) {
    console.error("❌ [CHECK] Impossibile ottenere i comandi globali:", error);
  }
}

// ─────────────────────────────────────────────
// 🧠 CREAZIONE CLIENT
// ─────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildBans
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
    Partials.Reaction,
    Partials.User
  ]
});

// ─────────────────────────────────────────────
// 🗂️ CARICAMENTO COMANDI DINAMICO (SAFE)
// ─────────────────────────────────────────────
client.commands = new Collection();
const commandsPath = path.resolve("src/commands");
const folders = fs.readdirSync(commandsPath);

for (const folder of folders) {
  const files = fs
    .readdirSync(`${commandsPath}/${folder}`)
    .filter(f => f.endsWith(".js"));

  for (const file of files) {
    try {
      const modulePath = `./commands/${folder}/${file}`;
      const imported = await import(modulePath);
      const command = imported?.default;

      if (!command || !command.name || !command.execute) {
        console.warn(`⚠️ Comando non valido o incompleto: ${file}`);
        continue;
      }

      client.commands.set(command.name, command);
      console.log(`✅ Comando caricato localmente: ${folder}/${command.name}`);
    } catch (err) {
      console.error(`❌ Errore nel comando ${folder}/${file}:`, err.message);
    }
  }
}

// ─────────────────────────────────────────────
// 🔗 CONNESSIONE DATABASE + AI
// ─────────────────────────────────────────────
await connectDatabase();
await testAILocal();

// ─────────────────────────────────────────────
// 🚀 AVVIO BOT
// ─────────────────────────────────────────────
client.once("ready", async () => {
  console.log("🚀───────────────────────────────");
  console.log(`✅ DM REALM ALPHA LOGGER attivo come ${client.user.tag}`);
  console.log("🧩 Moduli caricati: Members, Messages, Roles, Voice, Invites");
  console.log("🎟️ Ticket System + AI Listener + Sicurezza attivi");
  console.log("📡 Database MongoDB e AI connessi");
  console.log("🚀───────────────────────────────");

  // Esegui l’auto-deploy dei comandi
  await autoDeployCommands(client);

  // Esegui il check
  await checkCommandsLoaded(client);
});

// ─────────────────────────────────────────────
// 🎯 GESTIONE COMANDI
// ─────────────────────────────────────────────
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`❌ Nessun comando corrispondente trovato per: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "❌ Errore durante l’esecuzione del comando.", ephemeral: true });
    } else {
      await interaction.reply({ content: "❌ Errore durante l’esecuzione del comando.", ephemeral: true });
    }
  }
});

// ─────────────────────────────────────────────
// 📡 HANDLERS CLASSICI LOGGER
// ─────────────────────────────────────────────
memberHandler(client, process.env, WEBHOOKS);
messageHandler(client, process.env, WEBHOOKS);
moderationHandler(client, process.env, WEBHOOKS);
roleHandler(client, process.env, WEBHOOKS);
voiceHandler(client, process.env, WEBHOOKS);
inviteHandler(client, process.env, WEBHOOKS);

// ─────────────────────────────────────────────
// 🧠 SISTEMI INTELLIGENTI
// ─────────────────────────────────────────────
ticketSystem(client);
aiListener(client);
autoSecurity(client);

import "./ai/api.js";

// ─────────────────────────────────────────────
// 🔐 LOGIN
// ─────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);
