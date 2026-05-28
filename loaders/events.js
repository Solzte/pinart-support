const { readdirSync } = require("node:fs");
const { join } = require("node:path");

function loadEvents(client) {
  const eventsPath = join(__dirname, "..", "events");
  const eventFiles = readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const event = require(join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
}

module.exports = { loadEvents };
