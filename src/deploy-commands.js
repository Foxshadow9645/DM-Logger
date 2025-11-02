import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

// ─────────────────────────────────────────────
// ⚙️ CONFIGURAZIONE
// ─────────────────────────────────────────────
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;     // ID bot
const GUILD_ID = process.env.GUILD_ID;       // ID server DM REALM ALPHA

// ─────────────────────────────────────────────
// 📂 CARICAMENTO COMANDI
// ─────────────────────────────────────────────
const commands = [];
const commandsPath = path.resolve("src/commands");
const folders = fs.readdirSync(commandsPath);

for (const folder of folders) {
  const files = fs.readdirSync(`${commandsPath}/${folder}`).filter(f => f.endsWith(".js"));
  for (const file of files) {
    const command = (await import(`./commands/${folder}/${file}`)).default;
    if (command.name && command.description) {
      commands.push({
        name: command.name,
        description: command.description,
        options: command.options || [],
        default_member_permissions: command.defaultMemberPermissions || null
      });
    }
  }
}

// ─────────────────────────────────────────────
// 🚀 DEPLOY COMANDI
// ─────────────────────────────────────────────
const rest = new REST({ version: "10" }).setToken(TOKEN);

try {
  console.log(`🚀 Deploy comandi in corso (${commands.length})...`);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
  console.log("✅ Comandi registrati con successo nel server DM REALM ALPHA");
} catch (err) {
  console.error("❌ Errore durante il deploy dei comandi:", err);
}
