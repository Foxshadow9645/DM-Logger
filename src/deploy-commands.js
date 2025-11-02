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
const { DISCORD_TOKEN, CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error("❌ Errore: manca DISCORD_TOKEN o CLIENT_ID nel file .env");
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
      console.log(`✅ Caricato comando: ${folder}/${command.name}`);
    } else {
      console.warn(`⚠️  Comando non valido o incompleto: ${file}`);
    }
  }
}

// ─────────────────────────────────────────────
// 🚀 REGISTRAZIONE COMANDI GLOBALI
// ─────────────────────────────────────────────
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

try {
  console.log("🌍 Inizio registrazione comandi globali...");
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log(`✅ ${commands.length} comandi globali registrati con successo!`);
  console.log("⚠️ Potrebbero impiegare fino a 1 ora per apparire globalmente.");
} catch (error) {
  console.error("❌ Errore durante il deploy dei comandi:", error);
}
