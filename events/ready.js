const { Events } = require("discord.js");
const config = require("../config");
const { isTargetGuild } = require("../utils/helpers");
const { ensureColorRoles } = require("../handlers/colorRoles");
const { sendSupportPanel, sendColorRolePanel } = require("../handlers/tickets");
const { connectVoice } = require("../handlers/voice");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`[Bot] ${client.user.tag} aktif (v${config.version}).`);

    for (const guild of client.guilds.cache.values()) {
      if (!isTargetGuild(guild)) continue;

      console.log(`[Bot] Sunucu hazırlanıyor: ${guild.name}`);

      try {
        await guild.emojis.fetch();
        await ensureColorRoles(guild);
        await sendSupportPanel(guild, client);
        await sendColorRolePanel(guild, client);
        await connectVoice(guild);
      } catch (error) {
        console.error(`[Bot] ${guild.name} hazırlanırken hata:`, error.message);
      }
    }
  },
};
