const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
} = require("discord.js");
const config = require("../config");
const {
  fetchChannel,
  emojiTag,
  emojiByName,
  buttonEmoji,
  colorButtonEmoji,
  sanitizeUsername,
  isTicketChannel,
  isApplicationTicket,
  getTicketInfo,
  panelExists,
  removeBrokenPanels,
  canApproveApplication,
  safeReply,
} = require("../utils/helpers");

async function createTicket(interaction, type) {
  const guild = interaction.guild;
  const member = interaction.member;
  const prefix = type === "support" ? "destek" : "basvuru";
  const channelName = `${prefix}-${sanitizeUsername(member.user.username)}`;

  const existing = guild.channels.cache.find(
    (channel) =>
      channel.type === ChannelType.GuildText &&
      (channel.name === channelName ||
        channel.topic === `pinart-ticket:${member.id}:${type}`)
  );

  if (existing) {
    return safeReply(interaction, {
      content: `Zaten açık bir talep kanalın var: ${existing}`,
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const overwrites = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
    ...config.roles.staff.map((roleId) => ({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
      ],
    })),
  ];

  const ticketChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    topic: `pinart-ticket:${member.id}:${type}`,
    permissionOverwrites: overwrites,
    reason: "Pinart talep sistemi",
  });

  const isApplication = type === "application";

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle(isApplication ? "Başvuru Oluşturuldu" : "Talep Oluşturuldu")
    .setDescription(
      isApplication
        ? `${member}, başvurun oluşturuldu.\n\n` +
            "Yetkili ekip en kısa sürede seninle ilgilenecektir.\n" +
            "Onaylandığında yetkililer sana rol verebilir.\n" +
            "İşlem bitince aşağıdaki butonla talebi kapatabilirsin."
        : `${member}, talebin oluşturuldu.\n\n` +
            "Yetkili ekip en kısa sürede seninle ilgilenecektir.\n" +
            "İşlem bitince aşağıdaki butonla talebi kapatabilirsin."
    )
    .setFooter({ text: "Pinart Talep Sistemi" });

  const buttons = [];

  if (isApplication) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId("grant_application_role")
        .setLabel("Yetki Ver")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success)
    );
  }

  buttons.push(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Talebi Kapat")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );

  const row = new ActionRowBuilder().addComponents(...buttons);

  await ticketChannel.send({
    content: `${member} ${config.roles.staff.map((id) => `<@&${id}>`).join(" ")}`,
    embeds: [embed],
    components: [row],
  });

  return interaction.editReply({ content: `Talebin açıldı: ${ticketChannel}` });
}

async function grantApplicationRole(interaction) {
  if (!isApplicationTicket(interaction.channel)) {
    return safeReply(interaction, {
      content: "Bu buton sadece başvuru taleplerinde kullanılabilir.",
      ephemeral: true,
    });
  }

  const canApprove = await canApproveApplication(interaction.member, interaction.guild);

  if (!canApprove) {
    return safeReply(interaction, {
      content: "Bu butonu yalnızca yetkililer kullanabilir.",
      ephemeral: true,
    });
  }

  if (!config.application.approvalRoleId) {
    return safeReply(interaction, {
      content: "Onay rolü yapılandırılmamış. `.env` dosyasında `APPLICATION_APPROVAL_ROLE_ID` ayarla.",
      ephemeral: true,
    });
  }

  const ticketInfo = getTicketInfo(interaction.channel);
  if (!ticketInfo?.ownerId) {
    return safeReply(interaction, {
      content:
        "Talep sahibi bulunamadı. Yeni bir başvuru ticketı açıp tekrar dene.",
      ephemeral: true,
    });
  }

  const role =
    interaction.guild.roles.cache.get(config.application.approvalRoleId) ||
    (await interaction.guild.roles.fetch(config.application.approvalRoleId).catch(() => null));

  if (!role) {
    return safeReply(interaction, {
      content: `Onay rolü sunucuda bulunamadı. ID: \`${config.application.approvalRoleId}\``,
      ephemeral: true,
    });
  }

  const targetMember = await interaction.guild.members
    .fetch(ticketInfo.ownerId)
    .catch(() => null);

  if (!targetMember) {
    return safeReply(interaction, {
      content: "Talep sahibi sunucuda bulunamadı.",
      ephemeral: true,
    });
  }

  if (targetMember.roles.cache.has(role.id)) {
    return safeReply(interaction, {
      content: `${targetMember} zaten ${role} rolüne sahip.`,
      ephemeral: true,
    });
  }

  try {
    await targetMember.roles.add(role, `Başvuru onayı: ${interaction.user.tag}`);
    return safeReply(interaction, {
      content: `${interaction.user} tarafından ${targetMember} kullanıcısına ${role} rolü verildi.`,
    });
  } catch (error) {
    console.error("[Başvuru Onay]", error.message);
    return safeReply(interaction, {
      content:
        `Rol verilemedi: ${error.message}\n` +
        "Bot rolünü Discord sunucu ayarlarından verilecek rolün **üstüne** taşı.",
      ephemeral: true,
    });
  }
}

async function closeTicket(interaction) {
  if (!isTicketChannel(interaction.channel)) {
    return safeReply(interaction, {
      content: "Bu kanal bir talep kanalı değil.",
      ephemeral: true,
    });
  }

  const isStaff = config.roles.staff.some((id) =>
    interaction.member.roles.cache.has(id)
  );
  const topic = interaction.channel.topic || "";
  const ownsTicket =
    topic.includes(`pinart-ticket:${interaction.user.id}:`) ||
    interaction.channel.name.includes(sanitizeUsername(interaction.user.username));

  if (!isStaff && !ownsTicket) {
    return safeReply(interaction, {
      content: "Bu talebi kapatma yetkin yok.",
      ephemeral: true,
    });
  }

  await safeReply(interaction, { content: "Talep 5 saniye içinde kapatılıyor..." });
  setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

function getButtonLabelsFromMessage(message) {
  const labels = [];

  function walk(components) {
    if (!components) return;

    for (const component of components) {
      if (component.label) labels.push(component.label);
      if (component.components?.length) walk(component.components);
    }
  }

  walk(message.components);
  return labels;
}

function getAllTextFromComponents(components) {
  let text = "";

  function walk(list) {
    if (!list) return;

    for (const component of list) {
      if (typeof component.content === "string") text += component.content;
      if (component.components?.length) walk(component.components);
    }
  }

  walk(components);
  return text;
}

function isCurrentSupportPanelMessage(message) {
  if (message.author.id !== message.client.user.id) return false;
  if (!message.flags.has(MessageFlags.IsComponentsV2)) return false;

  const labels = getButtonLabelsFromMessage(message);
  if (
    !labels.includes("Destek Talebi Aç") ||
    !labels.includes("Yetkili / Paylaşımcı Başvurusu")
  ) {
    return false;
  }

  const text = getAllTextFromComponents(message.components);
  return text.includes("PINART DESTEK MERKEZİ") || text.includes("DESTEK VE BAŞVURU");
}

function isLegacySupportPanelMessage(message) {
  if (message.author.id !== message.client.user.id) return false;
  if (message.flags.has(MessageFlags.IsComponentsV2)) return false;

  const embed = message.embeds[0];
  if (!embed) return false;

  return isSupportPanel(embed);
}

function isSupportPanel(embed) {
  const title = embed.title || "";
  const description = embed.description || "";

  return (
    title.includes(config.panelTitles.support) ||
    title.includes("PINART SUPPORT CENTER") ||
    title.includes("DESTEK & BAŞVURU BİLGİLENDİRME") ||
    description.includes("SUPPORT & APPLICATION")
  );
}

function isColorPanel(embed) {
  const title = embed.title || "";
  return title.includes("PINART RENK ROLLERİ") || title.includes("PINART COLOR ROLES");
}

async function sendSupportPanel(guild, client) {
  const channel = await fetchChannel(guild, config.channels.support);
  if (!channel?.isTextBased()) {
    console.warn("[Panel] Destek kanalı bulunamadı.");
    return;
  }

  await guild.emojis.fetch().catch(() => null);

  const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  if (messages) {
    for (const message of messages.values()) {
      if (message.author.id !== client.user.id) continue;
      if (isCurrentSupportPanelMessage(message)) return;

      if (
        isLegacySupportPanelMessage(message) ||
        message.flags.has(MessageFlags.IsComponentsV2)
      ) {
        await message.delete().catch(() => {});
      }
    }
  }

  const shine = emojiTag(guild, config.emojis.supportShine, "✨");
  const warn = emojiTag(guild, config.emojis.supportWarn, "⚠️");
  const book = emojiTag(guild, config.emojis.supportBook, "📘");
  const staff = emojiTag(guild, config.emojis.supportStaff, "👤");

  const panelContent = `${shine} **PINART DESTEK MERKEZİ**

# 🛠️ DESTEK VE BAŞVURU

### ${warn} Yardıma mı ihtiyacın var?

Sunucumuzla ilgili destek almak veya başvuru yapmak için aşağıdaki butonlardan sana uygun olanı seçebilirsin.

${book} **Destek Talebi**
> Sunucuyla ilgili sorun, soru veya yardım taleplerin için özel bir kanal açılır.

${staff} **Yetkili / Paylaşımcı Başvurusu**
> Yetkili veya paylaşımcı olmak istiyorsan başvuru kanalı oluşturabilirsin.

${shine} **Bilgilendirme**
> Talep kanalları sadece sen ve yetkili ekip tarafından görülebilir.
> Ekibimiz en kısa sürede seninle ilgilenecektir.`;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket_support")
      .setLabel("Destek Talebi Aç")
      .setEmoji(buttonEmoji(guild, config.emojis.supportBook, "📘"))
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ticket_application")
      .setLabel("Yetkili / Paylaşımcı Başvurusu")
      .setEmoji(buttonEmoji(guild, config.emojis.supportStaff, "👤"))
      .setStyle(ButtonStyle.Secondary)
  );

  const container = new ContainerBuilder()
    .setAccentColor(config.embedColor)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(panelContent))
    .addActionRowComponents(row);

  await channel.send({
    components: [container],
    flags: MessageFlags.IsComponentsV2,
  });

  console.log("[Panel] Destek paneli gönderildi.");
}

async function sendColorRolePanel(guild, client) {
  const channel = await fetchChannel(guild, config.channels.getRole);
  if (!channel?.isTextBased()) {
    console.warn("[Panel] Rol alma kanalı bulunamadı.");
    return;
  }

  await guild.emojis.fetch().catch(() => null);

  const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  if (messages) {
    for (const message of messages.values()) {
      if (message.author.id !== client.user.id) continue;
      if (!message.flags.has(MessageFlags.IsComponentsV2)) continue;

      const hasColorButton = (() => {
        function walk(components) {
          for (const component of components || []) {
            if (component.customId?.startsWith("color_")) return true;
            if (component.components?.length && walk(component.components)) return true;
          }
          return false;
        }

        return walk(message.components);
      })();

      if (hasColorButton) {
        await message.delete().catch(() => {});
      }
    }
  }

  await removeBrokenPanels(channel, client.user.id, "colors", isColorPanel);

  const freshMessages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  if (freshMessages && panelExists(freshMessages, "colors")) return;

  const heart = emojiByName(guild, config.emojis.colorHeart, "💜");
  const booster = emojiByName(guild, config.emojis.boosterBadge, "💎");

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setAuthor({
      name: "PINART",
      iconURL: guild.iconURL() || client.user.displayAvatarURL(),
    })
    .setTitle(`${heart} PINART RENK ROLLERİ`)
    .setDescription(
      `# ✦ BOOSTER RENKLERİ

### Boost Üyelerine Özel

Sunucuda profilini özelleştirmek için aşağıdaki renk rollerinden birini seçebilirsin.

> ✦ Aynı anda sadece **1 renk** kullanabilirsin.
> ✦ Yeni renk seçince eski rengin kaldırılır.
> ✦ Tekrar aynı renge basarsan rengin silinir.

${booster} **Sadece sunucuya boost basan üyeler kullanabilir.**`
    )
    .setFooter({ text: config.panelFooters.colors });

  const rows = [];
  for (let i = 0; i < config.colorRoles.length; i += 4) {
    const row = new ActionRowBuilder();
    config.colorRoles.slice(i, i + 4).forEach((roleData) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`color_${roleData.name}`)
          .setEmoji(colorButtonEmoji(roleData))
          .setLabel(roleData.label)
          .setStyle(ButtonStyle.Secondary)
      );
    });
    rows.push(row);
  }

  await channel.send({ embeds: [embed], components: rows });
  console.log("[Panel] Renk rol paneli gönderildi.");
}

module.exports = {
  createTicket,
  closeTicket,
  grantApplicationRole,
  sendSupportPanel,
  sendColorRolePanel,
};
