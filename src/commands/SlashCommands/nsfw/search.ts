import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { Vivy } from "../../../Vivy";
import { SimpleError } from "../../../components/EmbedTemplates/Error";
import { AnimeEmbed } from "../../../components/EmbedTemplates/Anime";

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("searchnsfw")
    .setDescription("Search for a NSFW Anime/Manga")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the Media")
        .setRequired(true)
        .setAutocomplete(true)
    ),
  async autocomplete(client: Vivy, i: AutocompleteInteraction) {
    const optionInput = i.options.getFocused(true);

    if (optionInput.value.length === 0) return;

    const options = await client.anilistClient.SearchNSFW(
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
            `[${op?.type ?? "Unknown"}] ` + op?.title?.romaji ??
            op?.title?.english ??
            op?.title?.native ??
            "",
        }))
        .filter((op) => !op.name.endsWith("] "))
    );
  },
  async execute(client: Vivy, i: ChatInputCommandInteraction) {
    await i.deferReply();
    const mediaValue = i.options.getString("name", true);

    let mediaId: number;
    if (!mediaValue.startsWith("Id-")) {
      const anime = await client.anilistClient.SearchAnime(mediaValue, 1);
      if (!anime || !anime[0]) {
        await i.editReply({
          embeds: [
            SimpleError(`Unable to find any Anime with Name "${mediaValue}"`),
          ],
        });
        return;
      }
      mediaId = anime[0].id;
    } else {
      mediaId = parseInt(mediaValue.split("-")[1]);
    }
    const media = await client.anilistClient.GetMedia(mediaId);
    if (!media) {
      await i.editReply({
        embeds: [
          SimpleError(`Unable to find any Media with Name "${mediaValue}"`),
        ],
      });
      return;
    }
    const ReplyObj = AnimeEmbed(media);

    await i.editReply(ReplyObj);
  },
};
