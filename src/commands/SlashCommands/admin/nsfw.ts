import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { Vivy } from "../../../Vivy";

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("nsfw")
    .setDescription("Whether Ecchi Anime would be included in Anime Commands")
    //.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addBooleanOption((option) =>
      option
        .setName("allownsfw")
        .setDescription("Allow NSFW content or not")
        .setRequired(true)
    ),
  async execute(client: Vivy, i: ChatInputCommandInteraction) {},
};
