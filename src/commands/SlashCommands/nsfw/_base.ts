import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { BaseCommand, Vivy } from "../../../Vivy";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nsfw")
    .setDescription("nsfw Commands")
    .setNSFW(true),
  async autocomplete(
    command: BaseCommand,
    client: Vivy,
    i: AutocompleteInteraction
  ) {
    const subCommand = command.subCommands.get(i.options.getSubcommand());
    if (!subCommand || !subCommand.autocomplete) return;

    await subCommand.autocomplete(client, i);
  },
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
