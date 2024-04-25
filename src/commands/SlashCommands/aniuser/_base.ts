import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { BaseCommand, Vivy } from "../../../Vivy";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("aniuser")
    .setDescription("OAuth Anime Commands"),
  async execute(
    command: BaseCommand,
    client: Vivy,
    i: ChatInputCommandInteraction
  ) {
    const token = client.accessTokens.get(i.user.id);
    if (
      !(i.options.getSubcommand() === "login") &&
      (!token || token.expires_at <= Date.now()+10000 )
    ) {
      await i.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Unauthorized Access")
            .setDescription(
              "You will need to login using `login` command to perform this action"
            )
            .setColor("Red")
            .setTimestamp(),
        ],
        ephemeral: true
      });
      return;
    }

    const subCommand = command.subCommands.get(i.options.getSubcommand());
    if (!subCommand) return;

    await subCommand.execute(client, i);
  },
};
