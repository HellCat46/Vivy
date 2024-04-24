import { SlashCommandBuilder } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nsfw")
    .setDescription("nsfw Commands").setNSFW(true),
};
