const { Events } = require("discord.js");
const { isTargetGuild, safeReply } = require("../utils/helpers");
const { createTicket, closeTicket, grantApplicationRole } = require("../handlers/tickets");
const { handleColorRole } = require("../handlers/colorRoles");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton() || !interaction.inGuild()) return;
    if (!isTargetGuild(interaction.guild)) return;

    try {
      switch (interaction.customId) {
        case "ticket_support":
          return createTicket(interaction, "support");
        case "ticket_application":
          return createTicket(interaction, "application");
        case "close_ticket":
          return closeTicket(interaction);
        case "grant_application_role":
          return grantApplicationRole(interaction);
        default:
          if (interaction.customId.startsWith("color_")) {
            return handleColorRole(interaction);
          }
      }
    } catch (error) {
      console.error("[Interaction]", error);
      await safeReply(interaction, {
        content: "Bir hata oluştu. Lütfen tekrar dene.",
        ephemeral: true,
      }).catch(() => {});
    }
  },
};
