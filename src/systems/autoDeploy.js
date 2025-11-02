// ─────────────────────────────────────────────
// 🔁 AUTO DEPLOY COMANDI /
// ─────────────────────────────────────────────
import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

export default async function autoDeploy(client) {
  const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
  if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.warn("⚠️ Variabili mancanti per autoDeploy (DISCORD_TOKEN / CLIENT_ID / GUILD_ID)");
    return;
  }

  try {
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

    console.log("🌍 [AUTO-DEPLOY] Registrazione comandi globali + guild...");

    // 🌍 Comandi globali
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`✅ [AUTO-DEPLOY] ${commands.length} comandi globali registrati.`);

    // ⚡ Comandi istantanei nella DM Realm Alpha
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`⚡ [AUTO-DEPLOY] Comandi attivi immediatamente nella guild ${GUILD_ID}.`);

    console.log("🧩 [AUTO-DEPLOY] Sincronizzazione completata!");
  } catch (error) {
    console.error("❌ [AUTO-DEPLOY] Errore durante la sincronizzazione:", error);
  }
}
