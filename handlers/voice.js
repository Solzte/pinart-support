const {
  joinVoiceChannel,
  getVoiceConnection,
  entersState,
  VoiceConnectionStatus,
} = require("@discordjs/voice");
const { ChannelType } = require("discord.js");
const config = require("../config");
const { fetchChannel } = require("../utils/helpers");

async function connectVoice(guild) {
  const channel = await fetchChannel(guild, config.channels.voice);

  if (!channel || channel.type !== ChannelType.GuildVoice) {
    console.warn("[Ses] Ses kanalı bulunamadı.");
    return null;
  }

  const existing = getVoiceConnection(guild.id);
  if (existing) {
    existing.destroy();
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: true,
    selfMute: false,
  });

  connection.on(VoiceConnectionStatus.Ready, () => {
    console.log(`[Ses] ${channel.name} kanalına bağlandı.`);
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      connection.destroy();
      setTimeout(() => connectVoice(guild).catch(() => {}), 3_000);
    }
  });

  return connection;
}

module.exports = {
  connectVoice,
};
