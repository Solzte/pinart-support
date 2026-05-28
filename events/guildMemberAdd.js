const { Events } = require("discord.js");
const config = require("../config");
const { isTargetGuild } = require("../utils/helpers");

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (!isTargetGuild(member.guild)) return;

    const role = member.guild.roles.cache.get(config.roles.auto);
    if (!role) {
      console.warn("[Oto Rol] AUTO_ROLE_ID bulunamadı.");
      return;
    }

    try {
      await member.roles.add(role);
      console.log(`[Oto Rol] ${member.user.tag} kullanıcısına rol verildi.`);
    } catch (error) {
      console.error("[Oto Rol]", error.message);
    }
  },
};
