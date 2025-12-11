// ─────────────────────────────────────────────
// 📦 IMPORTAZIONI PRINCIPALI
// ─────────────────────────────────────────────
import dotenv from "dotenv";
dotenv.config();

import { Client, GatewayIntentBits, Partials, Collection, REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import { connectDatabase } from "./core/database.js";

// ⚙️ HANDLERS
import memberHandler from "./handlers/members.js";
import messageHandler from "./handlers/messages.js";
import moderationHandler from "./handlers/moderation.js";
import roleHandler from "./handlers/roles.js";
import voiceHandler from "./handlers/voice.js";
import inviteHandler from "./handlers/invites.js";

// 🧠 SISTEMI
import ticketSystem from "./systems/ticketSystem.js";
import staffClaim from "./systems/staffClaim.js";
import ticketAddUser from "./systems/ticketAddUser.js";
import ticketClose from "./systems/ticketClose.js";
import aiListener from "./systems/aiListener.js"; // IL NUOVO SISTEMA GEMINI
import autoSecurity from "./systems/autoSecurity.js";
import commandChecker from "./systems/commandChecker.js";

const WEBHOOKS = {
  join: process.env.WEBHOOK_JOIN,
  leave: process.env.WEBHOOK_LEAVE,
  messages: process.env.WEBHOOK_MESSAGES,
  voice: process.env.WEBHOOK_VOICE,
  punish: process.env.WEBHOOK_PUNISH,
  roles: process.env.WEBHOOK_ROLES,
  invites: process.env.WEBHOOK_INVITES
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildBans
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.Reaction, Partials.User]
});

// CARICAMENTO COMANDI
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
      if (command?.name && command?.execute) {
        client.commands.set(command.name, command);
        console.log(`✅ Comando caricato: ${folder}/${command.name}`);
      }
    } catch (err) { console.error(`❌ Errore comando ${file}:`, err.message); }
  }
}

// 🔗 CONNESSIONE DATABASE (Senza testAILocal)
await connectDatabase();

async function autoDeployCommands() {
  const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
  if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) return;
  const commands = [];
  // ... logica deploy semplificata per brevità, la tua originale va bene ...
  // L'importante è che qui NON ci siano chiamate a testAILocal()
}

client.once("ready", async () => {
  console.log(`✅ DM REALM ALPHA LOGGER attivo come ${client.user.tag}`);
  console.log("📡 Sistemi attivi: Ticket, AI Gemini, Security, Database");
  await commandChecker(client);
});

// GESTIONE INTERAZIONI
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try { await command.execute(interaction); } 
  catch (err) { console.error(err); }
});

// AVVIO MODULI
memberHandler(client, WEBHOOKS);
messageHandler(client, WEBHOOKS);
moderationHandler(client, WEBHOOKS);
roleHandler(client, WEBHOOKS);
voiceHandler(client, WEBHOOKS);
inviteHandler(client, WEBHOOKS);

ticketSystem(client);
staffClaim(client);
aiListener(client); // <--- L'unico gestore AI necessario
autoSecurity(client);
ticketAddUser(client);
ticketClose(client);

client.login(process.env.DISCORD_TOKEN);
