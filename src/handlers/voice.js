import { logEmbed } from "../core/embeds.js";
import { sendWebhook } from "../core/logger.js";

export default function voiceHandler(client, urls) {
  client.on("voiceStateUpdate", async (oldState, newState) => {
    const member = newState.member;
    if (!member || member.user.bot) return; // ignora i bot

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;
    const now = `<t:${Math.floor(Date.now() / 1000)}:F>`;
    const avatar = member.user.displayAvatarURL({ dynamic: true, size: 512 });

    const baseEmbed = {
      author: {
        name: "DM REALM ALPHA LOGGER",
        url: "https://discord.com/oauth2/authorize?client_id=1429110896910798928",
        icon_url: "https://cdn-icons-png.flaticon.com/512/892/892781.png"
      },
      footer: {
        text: "Nihil Difficile Volenti • Sistema di Sorveglianza Attiva\nDM REALM ALPHA — Monitor vocale"
      },
      thumbnail: { url: avatar },
      image: {
        url: "https://media.discordapp.net/attachments/873126567134494742/1429862125177667594/file_000000002ab86246b8dd9f8e630d018f.jpg"
      }
    };

    const embedBase = (title, desc, color) => {
      const e = logEmbed(title, desc, color);
      Object.assign(e.embeds[0], baseEmbed);
      e.username = "DM Alpha";
      e.avatar_url =
        "https://media.istockphoto.com/id/690772190/it/vettoriale/concetto-di-occhio-elettronico-del-grande-fratello-tecnologie-per-la-sorveglianza-globale.jpg?s=612x612&w=0&k=20&c=mmFwIgeRe5ApHaVBHzF4HrfXmA-OwX3EXrgpFmkJqp0=";
      return e;
    };

    // ─────────────────────────────
    // JOIN
    if (!oldChannel && newChannel) {
      const desc = [
        "🟢 **Accesso vocale rilevato**",
        "",
        `👤 Utente: <@${member.id}>`,
        `📍 Canale: <#${newChannel.id}>`,
        "",
        `🕒 Orario: ${now}`,
        "",
        `🧾 Tracciamento: Accesso registrato automaticamente`
      ].join("\n");
      return sendWebhook(
        urls.voice,
        embedBase("<:vcjoin_alpha:1430238007587377245> VC JOIN", desc, 0x1f6c33)
      );
    }

    // LEAVE
    if (oldChannel && !newChannel) {
      const desc = [
        "🔻 **Uscita vocale rilevata**",
        "",
        `👤 Utente: <@${member.id}>`,
        `📍 Canale lasciato: <#${oldChannel.id}>`,
        "",
        `🕒 Orario: ${now}`,
        "",
        `🧾 Tracciamento: Disconnessione automatica`
      ].join("\n");
      return sendWebhook(
        urls.voice,
        embedBase(
          "<:vcdisconnect_alpha:1430232401556148376> VC LEAVE",
          desc,
          0xdd2e44
        )
      );
    }

    // MOVE
    if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
      const desc = [
        "🔄 **Traslazione vocale registrata**",
        "",
        `👤 Utente: <@${member.id}>`,
        `📍 Da: <#${oldChannel.id}>`,
        `➡️ A: <#${newChannel.id}>`,
        "",
        `🕒 Orario: ${now}`,
        "",
        `🧾 Tracciamento: Spostamento tra canali vocali`
      ].join("\n");
      return sendWebhook(
        urls.voice,
        embedBase("<:vcjoin_alpha:1430238007587377245> VC MOVE", desc, 0x3498db)
      );
    }

    // ─────────────────────────────
    // SELF MUTE / UNMUTE
    if (!oldState.selfMute && newState.selfMute) {
      const desc = [
        "🔇 **Microfono disattivato manualmente**",
        "",
        `👤 Utente: <@${member.id}>`,
        `📍 Canale: <#${newChannel?.id || oldChannel?.id}>`,
        "",
        `🕒 Orario: ${now}`,
        "",
        `🧾 Tracciamento: Azione utente — microfono disattivato`
      ].join("\n");
      return sendWebhook(
        urls.voice,
        embedBase(
          "<:mutedmicrophonevc_alpha:1430233570198159433> MIC MUTED",
          desc,
          0x808080
        )
      );
    }

    if (oldState.selfMute && !newState.selfMute) {
      const desc = [
        "🎙️ **Microfono riattivato manualmente**",
        "",
        `👤 Utente: <@${member.id}>`,
        `📍 Canale: <#${newChannel?.id || oldChannel?.id}>`,
        "",
        `🕒 Orario: ${now}`,
        "",
        `🧾 Tracciamento: Azione utente — microfono riattivato`
      ].join("\n");
      return sendWebhook(
        urls.voice,
        embedBase(
          "<:vcmicrophone_alpha:1430232637087158373> MIC UNMUTED",
          desc,
          0x2ecc71
        )
      );
    }

    // ─────────────────────────────
    // STREAMING START / STOP (corrette)
    if (!oldState.streaming && newState.streaming) {
      const desc = [
        "📡 **Streaming avviato**",
        "",
        `👤 Utente: <@${member.id}>`,
        `📍 Canale: <#${newChannel?.id || oldChannel?.id}>`,
        "",
        `🕒 Orario: ${now}`,
        "",
        `🧾 Tracciamento: Avvio sessione streaming`
      ].join("\n");
      return sendWebhook(
        urls.voice,
        embedBase(
          "<:screensharevc_alpha:1430245124457107527> STREAM START",
          desc,
          0x0074d9
        )
      );
    }

    if (oldState.streaming && !newState.streaming) {
      const desc = [
        "📴 **Streaming terminato**",
        "",
        `👤 Utente: <@${member.id}>`,
        `📍 Canale: <#${newChannel?.id || oldChannel?.id}>`,
        "",
        `🕒 Orario: ${now}`,
        "",
        `🧾 Tracciamento: Fine condivisione schermo`
      ].join("\n");
      return sendWebhook(
        urls.voice,
        embedBase(
          "<:screenshareendvc_alpha:1430244985466388630> STREAM END",
          desc,
          0x555555
        )
      );
    }

    // ─────────────────────────────
    // SERVER MUTE / UNMUTE (AZIONI DA STAFF)
    if (!oldState.serverMute && newState.serverMute) {
      const executor = newState.guild.members.me; // se vuoi, qui si può tracciare l’audit log
      const desc = [
        "🚫 **Mute applicato dal personale di moderazione**",
        "",
        `👤 Utente coinvolto: <@${member.id}>`,
        `👮 Moderatore: <@${executor.id}>`,
        `📍 Canale: <#${newChannel?.id || oldChannel?.id}>`,
        "",
        `🕒 Orario: ${now}`,
        "",
        `🧾 Tracciamento: Azione disciplinare registrata`
      ].join("\n");
      return sendWebhook(
        urls.voice,
        embedBase(
          "<:modsupressedmicrophone_alpha:1430232939790078113> SERVER MUTE",
          desc,
          0xe74c3c
        )
      );
    }

    if (oldState.serverMute && !newState.serverMute) {
      const executor = newState.guild.members.me;
      const desc = [
        "✅ **Mute vocale rimosso dallo staff**",
        "",
        `👤 Utente coinvolto: <@${member.id}>`,
        `👮 Moderatore: <@${executor.id}>`,
        `📍 Canale: <#${newChannel?.id || oldChannel?.id}>`,
        "",
        `🕒 Orario: ${now}`,
        "",
        `🧾 Tracciamento: Ripristino vocale registrato`
      ].join("\n");
      return sendWebhook(
        urls.voice,
        embedBase(
          "<:vcmicrophone_alpha:1430232637087158373> SERVER UNMUTE",
          desc,
          0x2ecc71
        )
      );
    }

    // ─────────────────────────────
    // SERVER DEAF / UNDEAF (audio bloccato / ripristinato)
    if (!oldState.serverDeaf && newState.serverDeaf) {
      const executor = newState.guild.members.me;
      const desc = [
        "🔒 **Audio disattivato dallo staff**",
        "",
        `👤 Utente coinvolto: <@${member.id}>`,
        `👮 Moderatore: <@${executor.id}>`,
        `📍 Canale: <#${newChannel?.id || oldChannel?.id}>`,
        "",
        `🕒 Orario: ${now}`,
        "",
        `🧾 Tracciamento: Audio forzatamente disattivato`
      ].join("\n");
      return sendWebhook(
        urls.voice,
        embedBase(
          "<:modmutedvc_alpha:1430232872769421384> AUDIO OFF",
          desc,
          0xe67e22
        )
      );
    }

    if (oldState.serverDeaf && !newState.serverDeaf) {
      const executor = newState.guild.members.me;
      const desc = [
        "🔓 **Audio riattivato dallo staff**",
        "",
        `👤 Utente coinvolto: <@${member.id}>`,
        `👮 Moderatore: <@${executor.id}>`,
        `📍 Canale: <#${newChannel?.id || oldChannel?.id}>`,
        "",
        `🕒 Orario: ${now}`,
        "",
        `🧾 Tracciamento: Ripristino audio confermato`
      ].join("\n");
      return sendWebhook(
        urls.voice,
        embedBase(
          "<:vcmicrophone_alpha:1430232637087158373> AUDIO RESTORED",
          desc,
          0x27ae60
        )
      );
    }
  });
}
