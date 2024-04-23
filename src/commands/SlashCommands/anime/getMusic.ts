import {
  APIEmbedField,
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { Vivy } from "../../../Vivy";
import { SimpleError } from "../../../components/EmbedTemplates/Error";
import { GetOpAndEd } from "../../../components/ApiRequests";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getmusic")
    .setDescription("Get List of Anime Opening and Ending Music")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the anime")
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type of Music")
        .setChoices(
          { name: "Ending Music", value: "ED" },
          { name: "Opening Music", value: "OP" }
        )
    ),

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
  async execute(client: Vivy, i: ChatInputCommandInteraction) {
    await i.deferReply();
    const animeValue = i.options.getString("name", true);
    const typeOption = i.options.getString("type");

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

    const MusicInfo = await GetOpAndEd(animeId);
    if (
      MusicInfo instanceof Error ||
      MusicInfo.anime.length === 0 ||
      !MusicInfo.anime[0].animethemes
    ) {
      await i.editReply({
        embeds: [SimpleError("Unable to get info about the Anime")],
      });
      return;
    }

    let pageNo = -1;
    const pages: APIEmbedField[][] = [];

    const MusicList = typeOption
      ? MusicInfo.anime[0].animethemes.filter(
          (music) => music.type === typeOption
        )
      : MusicInfo.anime[0].animethemes;

    let fieldNo = 0;
    for (const music of MusicList) {
      if (fieldNo % 25 === 0) {
        fieldNo = 0;
        pages[++pageNo] = [];
      }
      pages[pageNo][fieldNo++] = {
        name: `${music.slug} (Episodes: ${music.animethemeentries
          .map((entry) => entry.episodes)
          .join(", ")})`,
        value: `[${
          music.song.title
        }](https://www.youtube.com/results?search_query=${(
          music.song.title +
          " " +
          MusicInfo.anime[0].name
        )
          .split(" ")
          .join("+")}) ${
          music.song.artists.length != 0
            ? `By __${music.song.artists
                .map((artist) => artist.name)
                .join(", ")}__`
            : ""
        } `,
      };
    }
    pageNo = 0;

    const embed = new EmbedBuilder().setTitle(`Music Theme of ${MusicInfo.anime[0].name}`).setColor("Random").setTimestamp().setFooter({text: "Source: AnimeThemes.moe"}).setFields(pages[pageNo]);
    const pageMove = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("Prev")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
    );

    if(pages.length === 1){
        await i.editReply({embeds: [embed]});
        return;
    }


    const collector = (
      await i.editReply({ embeds: [embed], components: [pageMove] })
    ).createMessageComponentCollector({
      time: 60_000,
      filter: (inter) => i.user.id === inter.user.id,
      componentType: ComponentType.Button,
    });

    collector.on("collect", (inter) => {
      if (inter.customId == "prev" && pageNo != 0) {
        pageNo--;
        embed.setFields(pages[pageNo]);
        inter.update({ embeds: [embed] });
      } else if (inter.customId == "next" && pageNo + 1 < pages.length) {
        pageNo++;
        embed.setFields(pages[pageNo]);
        inter.update({ embeds: [embed] });
      }
    });
    collector.once("end", () => {
      i.editReply({ components: [] });
    });
  },
};
