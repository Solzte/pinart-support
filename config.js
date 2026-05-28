const { version } = require("./package.json");

function parseEnvIds(value) {
  if (!value) return [];

  return value
    .split(/[,;]+/)
    .map((id) => id.trim().replace(/^<@!?(\d+)>$/, "$1").replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

module.exports = {
  version,
  guildId: null,

  roles: {
    booster: "1509457237926613113",
    auto: "1509457232956489739",
    staff: [
      "1509457245384212593",
      "1509457243790381087",
      "1509457241059754085",
    ],
  },

  channels: {
    support: "1509457272244535327",
    getRole: "1509457265957011537",
    voice: "1509478408994951219",
  },

  emojis: {
    supportShine: "1509517477548265503",
    supportWarn: "1509516993810927637",
    supportBook: "1509517531055128598",
    supportStaff: "1509517084521009192",
    colorHeart: "moria_sonsuzkalp",
    boosterBadge: "BoosterBadgesRoll",
  },

  colorRoles: [
    { name: "Red", label: "Kırmızı", emojiName: "tlwHeartsRed", emojiId: "1509496489330610219", color: 0xff3131 },
    { name: "Blue", label: "Mavi", emojiName: "tlwHeartsBlue", emojiId: "1509496529784934441", color: 0x2f6bff },
    { name: "Green", label: "Yeşil", emojiName: "tlwHeartsGreen", emojiId: "1509496561246404639", color: 0x22c55e },
    { name: "Yellow", label: "Sarı", emojiName: "yellowhearts_hatory", emojiId: "1509496614610272297", color: 0xfacc15 },
    { name: "Purple", label: "Mor", emojiName: "tlwHeartsPurple", emojiId: "1509496643282534561", color: 0x9333ea },
    { name: "Pink", label: "Pembe", emojiName: "tlwHeartsPink", emojiId: "1509496674547011694", color: 0xec4899 },
    { name: "Black", label: "Siyah", emojiName: "tlwHeartsBlack", emojiId: "1509496704175439923", color: 0x111111 },
    { name: "White", label: "Beyaz", emojiName: "whitehearts", emojiId: "1509496738812006570", color: 0xf5f5f5 },
  ],

  embedColor: 0x8b5cf6,
  panelTitles: {
    support: "PINART DESTEK MERKEZİ",
  },
  panelFooters: {
    colors: "💎 Özel Booster Renk Sistemi",
  },

  application: {
    approverUserIds: parseEnvIds(process.env.APPROVER_USER_IDS),
    approvalRoleId: process.env.APPLICATION_APPROVAL_ROLE_ID || null,
  },
};
