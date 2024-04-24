import { Interaction } from "discord.js";
import { Vivy } from "../Vivy";
import { SimpleError } from "../components/EmbedTemplates/Error";

module.exports = {
  once: false,
  async execute(client: Vivy, i: Interaction) {
    try {
      
      if (i.isChatInputCommand() && i.options.getSubcommand()) {
        const command = client.commands.get(i.commandName);
        if (!command) return;

        const subCommand = command.subCommands.get(i.options.getSubcommand())
        if(!subCommand) return

        await subCommand.execute(client, i);
      } else if (i.isAutocomplete()) {
        const command = client.commands.get(i.commandName);
        if (!command) return;


        const subCommand = command.subCommands.get(i.options.getSubcommand());
        if (!subCommand || !subCommand.autocomplete) return;

        
        await subCommand.autocomplete(client, i);
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
