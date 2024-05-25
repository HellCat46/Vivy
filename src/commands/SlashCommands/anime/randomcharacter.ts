import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { Vivy } from "../../../Vivy";
import { EmbedBuilder } from "@discordjs/builders";
import { CharacterEmbed } from "../../../components/EmbedTemplates/Anime";
import { SimpleError } from "../../../components/EmbedTemplates/Error";

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("randomchar")
    .setDescription("Get A Random Anime Character"),
  async execute(client: Vivy, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const character = await client.anilistClient.GetRandomCharacter();
    if(!character){
      await interaction.editReply({embeds: [SimpleError("Unable to fetch Character Info.")]});
      return;
    }


    await interaction.editReply({
      embeds: [
        CharacterEmbed(character)
      ],
    });
  },
};
