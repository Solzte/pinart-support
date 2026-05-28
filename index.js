require("dotenv").config();

const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { loadEvents } = require("./loaders/events");
const config = require("./config");

const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.error("[Bot] TOKEN bulunamadı. .env dosyasını kontrol et.");
  process.exit(1);
}

if (config.application.approverUserIds.length === 0) {
  console.warn("[Bot] APPROVER_USER_IDS tanımlı değil. Yetki Ver butonu kullanılamaz.");
} else {
  console.log(`[Bot] ${config.application.approverUserIds.length} onaylayıcı yüklendi.`);
}

if (!config.application.approvalRoleId) {
  console.warn("[Bot] APPLICATION_APPROVAL_ROLE_ID tanımlı değil.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});

loadEvents(client);

client.login(TOKEN);

process.on("unhandledRejection", (error) => {
  console.error("[Bot] Beklenmeyen hata:", error);
});
