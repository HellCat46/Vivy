import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { Vivy } from "../../../Vivy";
import { SimpleError } from "../../../components/EmbedTemplates/Error";
import { AnimeEmbed } from "../../../components/EmbedTemplates/Anime";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search for an anime")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the Anime")
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async execute(client: Vivy, i: ChatInputCommandInteraction) {
    await i.deferReply();
    const animeValue = i.options.getString("name", true);

    let animeId: number;
    if (!animeValue.startsWith("Id-")) {
      const anime = await client.anilistClient.SearchAnime(animeValue, 1);
      if (!anime || !anime[0]) {
        await i.editReply({
          embeds: [
            SimpleError(`Unable to find any Anime with Name "${animeValue}"`),
          ],
        });
        return;
      }
      animeId = anime[0].id;
    } else {
      animeId = parseInt(animeValue.split("-")[1]);
    }

    const anime = await client.anilistClient.GetAnime(animeId);
    if (!anime) {
      await i.editReply({
        embeds: [
          SimpleError(`Unable to find any Anime with Name "${animeValue}"`),
        ],
      });
      return;
    }

    const embedObj = AnimeEmbed(anime);
    await i.editReply(embedObj);
  },
  async autocomplete(client: Vivy, i: AutocompleteInteraction) {
    const optionInput = i.options.getFocused(true);

    if (optionInput.value.length === 0) return;

    const options = await client.anilistClient.SearchAnime(
      optionInput.value,
      10
    );
    if (!options) return;

    await i.respond(
      options
        .filter((op) => op !== null)
        .map((op) => ({
          value: `Id-${op?.id}`,
          name:
            op?.title?.romaji ?? op?.title?.english ?? op?.title?.native ?? "",
        }))
        .filter((op) => op.name.length > 0)
    );
  },
};
