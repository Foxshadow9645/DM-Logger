import dotenv from "dotenv";
dotenv.config();

import {
  Client,
  GatewayIntentBits,
  Partials
} from "discord.js";

import memberHandler from "./handlers/members.js";
import messageHandler from "./handlers/messages.js";
import moderationHandler from "./handlers/moderation.js";
import roleHandler from "./handlers/roles.js";
import voiceHandler from "./handlers/voice.js";
import inviteHandler from "./handlers/invites.js";

const TARGET_GUILD_ID = "1413141460416598062";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.Reaction]
});

const WEBHOOKS = {
  join: process.env.WEBHOOK_JOIN,
  leave: process.env.WEBHOOK_LEAVE,
  messages: process.env.WEBHOOK_MESSAGES,
  voice: process.env.WEBHOOK_VOICE,
  punish: process.env.WEBHOOK_PUNISH,
  roles: process.env.WEBHOOK_ROLES,
  invites: process.env.WEBHOOK_INVITES
};

// 🟢 Avvio
client.once("ready", async () => {
  console.log(`✅ DM REALM ALPHA LOGGER attivo come ${client.user.tag}`);
  console.log(`🛰️ I log vengono registrati solo per il server: ${TARGET_GUILD_ID}`);
});

// 🧩 Wrapper per i log handler con filtro guild
function withGuildFilter(handler) {
  return (client, urls) => {
    handler(
      {
        ...client,
        on: (event, listener) =>
          client.on(event, (...args) => {
            const ctx = args[0]?.guild || args[0]?.member?.guild || args[1]?.guild;
            if (ctx && ctx.id === TARGET_GUILD_ID) {
              listener(...args);
            }
          })
      },
      urls
    );
  };
}

// ✅ Handlers con filtro guild
withGuildFilter(memberHandler)(client, WEBHOOKS);
withGuildFilter(messageHandler)(client, WEBHOOKS);
withGuildFilter(moderationHandler)(client, WEBHOOKS);
withGuildFilter(roleHandler)(client, WEBHOOKS);
withGuildFilter(voiceHandler)(client, WEBHOOKS);
withGuildFilter(inviteHandler)(client, WEBHOOKS);

client.login(process.env.DISCORD_TOKEN);
