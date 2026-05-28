const config = require("../config");
const { safeReply } = require("../utils/helpers");

async function ensureColorRoles(guild) {
  for (const roleData of config.colorRoles) {
    const existing = guild.roles.cache.find((role) => role.name === roleData.name);
    if (existing) continue;

    await guild.roles.create({
      name: roleData.name,
      color: roleData.color,
      reason: "Pinart renk rol sistemi",
    });

    console.log(`[Roller] ${roleData.name} rolü oluşturuldu.`);
  }
}

function getColorRoles(guild) {
  return config.colorRoles
    .map((roleData) => guild.roles.cache.find((role) => role.name === roleData.name))
    .filter(Boolean);
}

async function handleColorRole(interaction) {
  if (!interaction.member.roles.cache.has(config.roles.booster)) {
    return safeReply(interaction, {
      content: "Bu renk rollerini sadece sunucuya boost basan üyeler kullanabilir.",
      ephemeral: true,
    });
  }

  const colorName = interaction.customId.replace("color_", "");
  const roleData = config.colorRoles.find((entry) => entry.name === colorName);

  if (!roleData) {
    return safeReply(interaction, {
      content: "Geçersiz renk seçimi.",
      ephemeral: true,
    });
  }

  const guild = interaction.guild;
  const member = interaction.member;
  const allColorRoles = getColorRoles(guild);
  const selectedRole = guild.roles.cache.find((role) => role.name === colorName);

  if (!selectedRole) {
    return safeReply(interaction, {
      content: "Bu renk rolü bulunamadı. Yetkililere bildir.",
      ephemeral: true,
    });
  }

  const hadRole = member.roles.cache.has(selectedRole.id);

  try {
    if (allColorRoles.length > 0) {
      await member.roles.remove(allColorRoles);
    }

    if (hadRole) {
      return safeReply(interaction, {
        content: `${roleData.label} rengin kaldırıldı.`,
        ephemeral: true,
      });
    }

    await member.roles.add(selectedRole);
    return safeReply(interaction, {
      content: `${roleData.label} rengini aldın.`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("[Renk Rol]", error.message);
    return safeReply(interaction, {
      content:
        "Rol verilemedi. Bot rolünün bu renk rollerinin üstünde olduğundan emin ol.",
      ephemeral: true,
    });
  }
}

module.exports = {
  ensureColorRoles,
  handleColorRole,
};
