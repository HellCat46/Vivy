import { Interaction } from "discord.js";
import { Vivy } from "../Vivy";
import { SimpleError } from "../components/EmbedTemplates/Error";

module.exports = {
  once: false,
  async execute(client: Vivy, i: Interaction) {
    if (i.isAutocomplete()) return;
    try {
      if (i.isChatInputCommand()) {
        const command = client.commands.get(i.commandName);

        if (!command) return;

        command.execute(client, i);
      }
    } catch (ex) {
      console.error(ex);
      if (i.replied || i.deferred) {
        await i.followUp({
          embeds: [
            SimpleError("There was an error while executing the command!"),
          ],
          ephemeral: true,
        });
      } else {
        await i.reply({
          embeds: [
            SimpleError("There was an error while executing the command!"),
          ],
          ephemeral: true,
        });
      }
    }
  },
};
