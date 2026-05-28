const { ChannelType, PermissionFlagsBits, OverwriteType } = require("discord.js");
const config = require("../config");

async function fetchChannel(guild, channelId) {
  if (!channelId) return null;
  return guild.channels.fetch(channelId).catch(() => null);
}

function isTargetGuild(guild) {
  return !config.guildId || guild.id === config.guildId;
}

function emojiTag(guild, emojiId, fallback = "") {
  const emoji = guild.emojis.cache.get(emojiId);
  if (!emoji) return fallback;
  return emoji.animated
    ? `<a:${emoji.name}:${emoji.id}>`
    : `<:${emoji.name}:${emoji.id}>`;
}

function emojiByName(guild, name, fallback = "") {
  const emoji = guild.emojis.cache.find((e) => e.name === name);
  if (!emoji) return fallback;
  return emoji.animated
    ? `<a:${emoji.name}:${emoji.id}>`
    : `<:${emoji.name}:${emoji.id}>`;
}

function buttonEmoji(guild, emojiId, fallback) {
  const emoji = guild.emojis.cache.get(emojiId);
  if (!emoji) return fallback;
  return { id: emoji.id, name: emoji.name, animated: emoji.animated };
}

function colorButtonEmoji(roleData) {
  return {
    id: roleData.emojiId,
    name: roleData.emojiName,
    animated: true,
  };
}

function sanitizeUsername(username) {
  return username.toLowerCase().replace(/[^a-z0-9-]/g, "") || "user";
}

function getTicketTypeFromName(channelName) {
  if (channelName.startsWith("basvuru-") || channelName.startsWith("application-")) {
    return "application";
  }
  if (channelName.startsWith("destek-") || channelName.startsWith("support-")) {
    return "support";
  }
  return null;
}

function getTicketOwnerId(channel) {
  const topic = channel?.topic || "";
  const topicMatch = topic.match(/^pinart-ticket:(\d+):(support|application)$/);
  if (topicMatch) return topicMatch[1];

  const memberOverwrite = channel.permissionOverwrites?.cache.find(
    (overwrite) =>
      overwrite.type === OverwriteType.Member &&
      overwrite.allow.has(PermissionFlagsBits.ViewChannel)
  );

  return memberOverwrite?.id || null;
}

function getTicketInfo(channel) {
  const topic = channel?.topic || "";
  const topicMatch = topic.match(/^pinart-ticket:(\d+):(support|application)$/);
  if (topicMatch) {
    return { ownerId: topicMatch[1], type: topicMatch[2] };
  }

  const type = getTicketTypeFromName(channel?.name || "");
  if (!type) return null;

  const ownerId = getTicketOwnerId(channel);
  if (!ownerId) return null;

  return { ownerId, type };
}

function isApplicationTicket(channel) {
  const info = getTicketInfo(channel);
  if (info) return info.type === "application";
  if (!channel) return false;
  return channel.name.startsWith("basvuru-") || channel.name.startsWith("application-");
}

function isTicketChannel(channel) {
  if (!channel || channel.type !== ChannelType.GuildText) return false;
  return (
    channel.name.startsWith("destek-") ||
    channel.name.startsWith("basvuru-") ||
    channel.name.startsWith("support-") ||
    channel.name.startsWith("application-")
  );
}

function panelExists(messages, panelType) {
  return messages.some((message) => {
    if (message.author.id !== message.client.user.id) return false;
    if (!message.components?.length || !message.embeds[0]) return false;

    const embed = message.embeds[0];

    if (panelType === "support") {
      return (embed.title || "").includes(config.panelTitles.support);
    }

    return embed.footer?.text === config.panelFooters[panelType];
  });
}

async function removeBrokenPanels(channel, clientUserId, panelType, matchFn) {
  const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  if (!messages) return null;

  const stale = messages.filter((message) => {
    if (message.author.id !== clientUserId || message.embeds.length === 0) return false;

    const embed = message.embeds[0];
    if (!matchFn(embed)) return false;

    if (panelType === "support") {
      return !(embed.title || "").includes(config.panelTitles.support);
    }

    return embed.footer?.text !== config.panelFooters[panelType];
  });

  for (const message of stale.values()) {
    await message.delete().catch(() => {});
  }

  return messages;
}

async function canApproveApplication(member, guild) {
  if (!member || !guild) return false;

  let approver = member;

  if (!member.roles?.cache?.size) {
    approver = await guild.members.fetch(member.id).catch(() => null);
    if (!approver) return false;
  }

  const approverIds = [
    ...new Set([...config.application.approverUserIds, ...config.roles.staff]),
  ];

  for (const id of approverIds) {
    if (approver.id === id) return true;
    if (approver.roles.cache.has(id)) return true;
  }

  return false;
}

async function safeReply(interaction, options) {
  if (interaction.replied || interaction.deferred) {
    return interaction.followUp(options);
  }
  return interaction.reply(options);
}

module.exports = {
  fetchChannel,
  isTargetGuild,
  emojiTag,
  emojiByName,
  buttonEmoji,
  colorButtonEmoji,
  sanitizeUsername,
  getTicketInfo,
  isApplicationTicket,
  isTicketChannel,
  panelExists,
  removeBrokenPanels,
  canApproveApplication,
  safeReply,
};
