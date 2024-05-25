import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { Vivy } from "../../../Vivy";
import { SimpleError } from "../../../components/EmbedTemplates/Error";
import { CharacterEmbed } from "../../../components/EmbedTemplates/Anime";

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("random")
    .setDescription("Get a random character from your anilist")
    .addStringOption((option) =>
      option
        .setName("mediatype")
        .setDescription("Type of Media")
        .addChoices(
          { name: "Anime", value: "ANIME" },
          { name: "Manga", value: "MANGA" }
        )
        .setRequired(true)
    ),
  async execute(client: Vivy, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const mediatype = interaction.options.getString("mediatype", true);
    const userId = client.accessTokens.get(interaction.user.id)?.userId;

    if (!userId) {
      await interaction.editReply({
        embeds: [
          SimpleError("You need to be logged in to perform this action."),
        ],
      });
      return;
    }
    if (!(mediatype === "MANGA" || mediatype === "ANIME")) {
      await interaction.editReply({
        embeds: [SimpleError("Unknown Type of Media")],
      });
      return;
    }

    const character = await client.anilistClient.GetRandomCharacterFromList(
      userId,
      mediatype
    );
    if (character instanceof Error) {
      await interaction.editReply({ embeds: [SimpleError(character.message)] });
      return;
    }

    await interaction.editReply({ embeds: [CharacterEmbed(character)] });
  },
};
