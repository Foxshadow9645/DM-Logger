// ─────────────────────────────────────────────
// 📦 IMPORTAZIONI
// ─────────────────────────────────────────────
import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

// ─────────────────────────────────────────────
// 🔧 CONFIG
// ─────────────────────────────────────────────
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ Errore: manca DISCORD_TOKEN, CLIENT_ID o GUILD_ID nel file .env");
  process.exit(1);
}

// ─────────────────────────────────────────────
// 📁 RACCOLTA DEI COMANDI
// ─────────────────────────────────────────────
const commands = [];
const foldersPath = path.resolve("src/commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = (await import(filePath)).default;

    if (command && command.name && command.description) {
      commands.push({
        name: command.name,
        description: command.description,
        options: command.options || []
      });
      console.log(`✅ Comando caricato: ${folder}/${command.name}`);
    } else {
      console.warn(`⚠️  Comando non valido o incompleto: ${file}`);
    }
  }
}

// ─────────────────────────────────────────────
// 🚀 REGISTRAZIONE COMANDI
// ─────────────────────────────────────────────
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

try {
  console.log("🌍 Inizio registrazione comandi GLOBALI + GUILD...");

  // 1️⃣ Globali (propagano ovunque)
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log(`✅ ${commands.length} comandi globali registrati con successo!`);
  console.log("⚠️ I comandi globali impiegheranno fino a 1 ora per propagarsi.");

  // 2️⃣ Guild (immediati nel server DM Realm Alpha)
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  console.log(`⚡ Comandi registrati istantaneamente nella guild ${GUILD_ID}`);

  console.log("✅ Deploy completato con successo!");
} catch (error) {
  console.error("❌ Errore durante il deploy dei comandi:", error);
}
