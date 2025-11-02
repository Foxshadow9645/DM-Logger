// ─────────────────────────────────────────────
// ⚙️ DM REALM ALPHA — ROLE DEPLOY SYSTEM
// Sincronizza automaticamente i ruoli principali
// ─────────────────────────────────────────────
import chalk from "chalk";

const ROLES_MODEL = [
  { name: "Founder", color: "#ff0000", hoist: true },
  { name: "Co-Founder", color: "#ff4d00", hoist: true },
  { name: "CEO", color: "#ff8000", hoist: true },
  { name: "Executive", color: "#ffaa00", hoist: true },
  { name: "Head Administrator", color: "#ffcc00", hoist: true },
  { name: "Director", color: "#ffe100", hoist: true },
  { name: "Management Moderator", color: "#ffff00", hoist: true },
  { name: "Administrator", color: "#c6ff00", hoist: true },
  { name: "Head Moderator", color: "#7cff00", hoist: true },
  { name: "Moderator", color: "#33ff00", hoist: true },
  { name: "Helper", color: "#00ff88", hoist: true },
  { name: "Trial Helper", color: "#00ffc6", hoist: true },
  { name: "Holder", color: "#00ffe5", hoist: true }
];

// ID del server principale (deploy immediato)
const MAIN_GUILD_ID = "1413141460416598062";

export async function deployRolesForGuild(guild) {
  try {
    console.log(chalk.cyan(`🔧 Sincronizzazione ruoli per ${guild.name} (${guild.id})`));

    for (const roleData of ROLES_MODEL) {
      const existing = guild.roles.cache.find(r => r.name.toLowerCase() === roleData.name.toLowerCase());

      if (!existing) {
        await guild.roles.create({
          name: roleData.name,
          color: roleData.color,
          hoist: roleData.hoist,
          reason: "Deploy automatico DM REALM ALPHA"
        });
        console.log(chalk.green(`✅ Creato ruolo: ${roleData.name}`));
      } else {
        await existing.edit({
          color: roleData.color,
          hoist: roleData.hoist,
          reason: "Allineamento ruoli DM REALM ALPHA"
        });
        console.log(chalk.yellow(`🌀 Aggiornato ruolo: ${roleData.name}`));
      }
    }

    console.log(chalk.greenBright(`✅ Ruoli sincronizzati correttamente in ${guild.name}`));
  } catch (err) {
    console.error(chalk.red(`❌ Errore durante deploy ruoli in ${guild.name}: ${err.message}`));
  }
}

// ─────────────────────────────────────────────
// 🔁 Handler globale (eseguito all’avvio)
// ─────────────────────────────────────────────
export default async function roleDeploySystem(client) {
  client.on("ready", async () => {
    console.log(chalk.blue("\n🌍 Inizio deploy ruoli automatico...\n"));

    // Deploy immediato nel server principale
    const mainGuild = client.guilds.cache.get(MAIN_GUILD_ID);
    if (mainGuild) await deployRolesForGuild(mainGuild);

    // Deploy automatico in tutti gli altri server
    for (const [guildId, guild] of client.guilds.cache) {
      if (guildId === MAIN_GUILD_ID) continue;
      await deployRolesForGuild(guild);
    }

    console.log(chalk.green("\n✅ Deploy ruoli completato globalmente!\n"));
  });

  // Deploy istantaneo quando il bot entra in un nuovo server
  client.on("guildCreate", async guild => {
    console.log(chalk.magenta(`➕ Nuovo server rilevato: ${guild.name} (${guild.id})`));
    await deployRolesForGuild(guild);
  });
}
