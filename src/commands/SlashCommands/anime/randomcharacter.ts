import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { Vivy } from "../../../Vivy";
import { EmbedBuilder } from "@discordjs/builders";

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("randomchar")
    .setDescription("Get A Random Anime Character"),
  async execute(client: Vivy, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const character = await client.anilistClient.GetRandomCharacter();


    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(character?.name?.full ?? character?.name?.native ?? null)
          .setDescription(
            `${
              character?.name?.alternative?.at(0)
                ? "**Alternative Title:** " +
                  character.name.alternative.join(", ") +
                  "\n"
                : ""
            }${
              character?.name?.alternativeSpoiler?.at(0)
                ? "**Spoiler Title:** ||" +
                  character.name.alternativeSpoiler.join(", ") +
                  "||\n"
                : ""
            }${character?.description ?? ""} ` // One White is required in case all the fields were null or empty
          )
          .setImage(character?.image?.large ?? null)
          .setTimestamp()
          .setURL(character?.siteUrl ?? null),
      ],
    });
  },
};
