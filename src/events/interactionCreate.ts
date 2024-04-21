import { Interaction } from "discord.js";
import { Vivy } from "../Vivy";
import { SimpleError } from "../components/EmbedTemplates/Error";

module.exports = {
  once: false,
  async execute(client: Vivy, i: Interaction) {
    try {
      if (i.isChatInputCommand()) {
        const command = client.commands.get(i.commandName);
        if (!command) return;

        await command.execute(client, i);
      } else if (i.isAutocomplete()) {
        const command = client.commands.get(i.commandName);
        if (!command || !command.autocomplete) return;
        
        await command.autocomplete(client, i);
      }
    } catch (ex) {
      console.error(ex);
      if (i.isAutocomplete()) return;
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
