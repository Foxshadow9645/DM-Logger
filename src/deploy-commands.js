import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ Errore: manca DISCORD_TOKEN o CLIENT_ID o GUILD_ID");
  process.exit(1);
}

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
      console.warn(`⚠️ Comando non valido o incompleto: ${file}`);
    }
  }
}

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

try {
  console.log("🌍 Registrazione comandi GLOBALI + GUILD...");
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log(`✅ ${commands.length} comandi globali registrati!`);

  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  console.log(`⚡ Comandi immediatamente disponibili nella guild ${GUILD_ID}`);

  console.log("✅ Deploy comandi completato!");
} catch (error) {
  console.error("❌ Errore durante il deploy dei comandi:", error);
}
