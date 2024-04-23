import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Vivy } from "../../../Vivy";
import { AnimeEmbed } from "../../../components/EmbedTemplates/Anime";
import { GetOpAndEd } from "../../../components/ApiRequests";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("random")
    .setDescription("Get a Random Anime"),
  async execute(client: Vivy, i: ChatInputCommandInteraction) {
    await i.deferReply();

    try {
      const anime = await client.anilistClient.GetRandomAnime(false);

      const res = await GetOpAndEd(anime.id);

      const msgOptions =
        res instanceof Error ? AnimeEmbed(anime) : AnimeEmbed(anime, res);

      await i.editReply(msgOptions);
    } catch (ex) {
      console.log(ex);
    }
  },
};
