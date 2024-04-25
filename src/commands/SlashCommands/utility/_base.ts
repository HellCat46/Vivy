import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { BaseCommand, Vivy } from "../../../Vivy";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("utils")
    .setDescription("Utility Commands"),
  async execute(
    command: BaseCommand,
    client: Vivy,
    i: ChatInputCommandInteraction
  ) {
    const subCommand = command.subCommands.get(i.options.getSubcommand());
    if (!subCommand) return;

    await subCommand.execute(client, i);
  },
};