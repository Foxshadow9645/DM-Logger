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

client.once("ready", () => {
  console.log(`✅ DM REALM ALPHA Logger ATTIVO come ${client.user.tag}`);
});

memberHandler(client, WEBHOOKS);
messageHandler(client, WEBHOOKS);
moderationHandler(client, WEBHOOKS);
roleHandler(client, WEBHOOKS);
voiceHandler(client, WEBHOOKS);
inviteHandler(client, WEBHOOKS);

client.login(process.env.DISCORD_TOKEN);