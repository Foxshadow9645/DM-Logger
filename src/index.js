// ─────────────────────────────────────────────
// 📦 IMPORTAZIONI PRINCIPALI
// ─────────────────────────────────────────────
import dotenv from "dotenv";
dotenv.config();

import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  REST,
  Routes
} from "discord.js";
import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────
// 🔧 CORE E DATABASE
// ─────────────────────────────────────────────
import { connectDatabase } from "./core/database.js";

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
import staffClaim from "./systems/staffClaim.js";
import ticketAddUser from "./systems/ticketAddUser.js";
import ticketClose from "./systems/ticketClose.js";
import aiListener from "./systems/aiListener.js"; // Sistema AI Integrato
import autoSecurity from "./systems/autoSecurity.js";
import roleSelector from "./systems/roleSelector.js";
import commandChecker from "./systems/commandChecker.js";

// ─────────────────────────────────────────────
// ⚙️ CONFIG WEBHOOKS
// ─────────────────────────────────────────────
const WEBHOOKS = {
  join: process.env.WEBHOOK_JOIN,
  leave: process.env.WEBHOOK_LEAVE,
  messages: process.env.WEBHOOK_MESSAGES,
  voice: process.env.WEBHOOK_VOICE,
  punish: process.env.WEBHOOK_PUNISH,
  roles: process.env.WEBHOOK_ROLES,
  invites: process.env.WEBHOOK_INVITES
};

// Controllo presenza webhook
for (const [key, url] of Object.entries(WEBHOOKS)) {
  if (!url) console.warn(`⚠️ Webhook mancante per: ${key}`);
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
// 🗂️ CARICAMENTO COMANDI DINAMICO
// ─────────────────────────────────────────────
client.commands = new Collection();
const commandsPath = path.resolve("src/commands");
const folders = fs.readdirSync(commandsPath);

for (const folder of folders) {
  const files = fs.readdirSync(`${commandsPath}/${folder}`).filter(f => f.endsWith(".js"));
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
      console.log(`✅ Comando caricato: ${folder}/${command.name}`);
    } catch (err) {
      console.error(`❌ Errore nel comando ${folder}/${file}:`, err.message);
    }
  }
}

// ─────────────────────────────────────────────
// 🔗 CONNESSIONE DATABASE
// ─────────────────────────────────────────────
await connectDatabase();

// ─────────────────────────────────────────────
// 🔁 AUTO DEPLOY + CHECK COMANDI
// ─────────────────────────────────────────────
async function autoDeployCommands() {
  const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
  if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.warn("⚠️ Variabili mancanti per autoDeploy (DISCORD_TOKEN / CLIENT_ID / GUILD_ID)");
    return;
  }

  const commands = [];
  const foldersPath = path.resolve("src/commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = (await import(filePath)).default;
      if (command?.name && command?.description) {
        commands.push({
          name: command.name,
          description: command.description,
          options: command.options || []
        });
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
    console.log(`✅ [AUTO-DEPLOY] Comandi attivi immediatamente nella guild ${GUILD_ID}.`);
  } catch (error) {
    console.error("❌ [AUTO-DEPLOY] Errore durante la sincronizzazione dei comandi:", error);
  }
}

// ─────────────────────────────────────────────
// 🚀 AVVIO BOT
// ─────────────────────────────────────────────
client.once("ready", async () => {
  console.log("🚀───────────────────────────────");
  console.log(`✅ DM REALM ALPHA LOGGER attivo come ${client.user.tag}`);
  console.log("📡 Sistemi attivi: Ticket, AI (Groq/Llama3), Security, Database");
  console.log("🚀───────────────────────────────");

  // Auto-deploy e verifica comandi
  await autoDeployCommands();
  await commandChecker(client);
});

// ─────────────────────────────────────────────
// 🎯 GESTIONE COMANDI
// ─────────────────────────────────────────────
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

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
memberHandler(client, WEBHOOKS);
messageHandler(client, WEBHOOKS);
moderationHandler(client, WEBHOOKS);
roleHandler(client, WEBHOOKS);
voiceHandler(client, WEBHOOKS);
inviteHandler(client, WEBHOOKS);

// ─────────────────────────────────────────────
// 🧠 SISTEMI INTELLIGENTI
// ─────────────────────────────────────────────
ticketSystem(client);
roleSelector(client);
staffClaim(client);
aiListener(client);
autoSecurity(client);
ticketAddUser(client);
ticketClose(client);

// ─────────────────────────────────────────────
// 🔐 LOGIN
// ─────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);
