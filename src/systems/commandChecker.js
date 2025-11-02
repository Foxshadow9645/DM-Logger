// ─────────────────────────────────────────────
// 🔍 CONTROLLO STATO COMANDI REGISTRATI
// ─────────────────────────────────────────────
import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

export default async function commandChecker(client) {
  const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

  console.log("🔎 [CHECKER] Verifica stato comandi in corso...");

  try {
    // Ottiene la lista dei comandi su Discord
    const globalCommands = await rest.get(Routes.applicationCommands(CLIENT_ID));
    const guildCommands = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));

    // Ottiene la lista dei comandi locali dal codice
    const localCommands = [];
    const foldersPath = path.resolve("src/commands");
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);
      const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = (await import(filePath)).default;
        if (command?.name) localCommands.push(command.name);
      }
    }

    // Confronto tra locale e Discord
    const globalNames = globalCommands.map(cmd => cmd.name);
    const guildNames = guildCommands.map(cmd => cmd.name);

    const missingInGlobal = localCommands.filter(c => !globalNames.includes(c));
    const missingInGuild = localCommands.filter(c => !guildNames.includes(c));
    const extraGlobal = globalNames.filter(c => !localCommands.includes(c));
    const extraGuild = guildNames.filter(c => !localCommands.includes(c));

    // Risultati
    console.log("────────────────────────────");
    console.log(`📡 [GLOBALI] ${globalCommands.length} comandi registrati`);
    console.log(`🏛️ [GUILD]   ${guildCommands.length} comandi registrati`);
    console.log(`💾 [LOCALI]  ${localCommands.length} comandi nel codice`);
    console.log("────────────────────────────");

    if (missingInGlobal.length)
      console.warn(`⚠️  Mancano nel registro globale: ${missingInGlobal.join(", ")}`);
    if (missingInGuild.length)
      console.warn(`⚠️  Mancano nel registro della guild: ${missingInGuild.join(", ")}`);
    if (extraGlobal.length)
      console.warn(`🗑️  Obsoleti nel registro globale: ${extraGlobal.join(", ")}`);
    if (extraGuild.length)
      console.warn(`🗑️  Obsoleti nel registro della guild: ${extraGuild.join(", ")}`);

    if (
      !missingInGlobal.length &&
      !missingInGuild.length &&
      !extraGlobal.length &&
      !extraGuild.length
    ) {
      console.log("✅ [CHECKER] Tutti i comandi sono sincronizzati perfettamente!");
    }

    console.log("────────────────────────────");
  } catch (err) {
    console.error("❌ [CHECKER] Errore durante la verifica dei comandi:", err.message);
  }
}
