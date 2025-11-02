import { handleHybridResponse } from "../ai/hybrid.js";

export default function aiListener(client) {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const name = message.channel.name.toLowerCase();
    if (!name.includes("ticket")) return;

    const res = await handleHybridResponse(
      message.content,
      message.author.id,
      message.channel.id
    );

    await message.reply({
      content: `**[${res.source.toUpperCase()}]** ${res.reply}`,
      allowedMentions: { repliedUser: false }
    });
  });
}

