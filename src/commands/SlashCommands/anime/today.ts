import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { Vivy } from "../../../Vivy";
import { SimpleError } from "../../../components/EmbedTemplates/Error";

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("today")
    .setDescription("List of Anime Airing Today"),
  async execute(client: Vivy, i: ChatInputCommandInteraction) {
    await i.deferReply();
    const embed = new EmbedBuilder()
      .setTitle(
        `Anime Airing Today (${
          Intl.DateTimeFormat().resolvedOptions().timeZone
        })`
      )
      .setFooter({
        text: "Note: Anime Name Preference can be change using `/setpreference` command",
      });

    const animes = await client.anilistClient.GetAiringToday();

    if (!(animes instanceof Array)) {
      await i.editReply({
        embeds: [SimpleError("Unable to get list of anime airing today!")],
      });
      return;
    }

    for (const anime of animes) {
      const animeEngName = anime?.media?.title?.english;
      const animeNatName = anime?.media?.title?.romaji;

      if (!anime || !animeEngName || !animeNatName) continue;

      embed.addFields({
        name: animeNatName,
        value: `**__Episode ${anime.episode} will air in <t:${
          Math.floor(Date.now() / 1000) + anime.timeUntilAiring
        }:R> at <t:${anime.airingAt}:t>__**`,
      });
    }

    await i.editReply({ embeds: [embed] });
  },
};
