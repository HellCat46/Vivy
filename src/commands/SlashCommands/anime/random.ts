import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { Vivy } from "../../../Vivy";
import { AnimeEmbed } from "../../../components/EmbedTemplates/Anime";
import { GetOpAndEd } from "../../../components/ApiRequests";

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("random")
    .setDescription("Get a Random Anime"),
  async execute(client: Vivy, i: ChatInputCommandInteraction) {
    await i.deferReply();

    try {
      const anime = await client.anilistClient.GetRandomAnime(false);

      const msgOptions = AnimeEmbed(anime);

      await i.editReply(msgOptions);
    } catch (ex) {
      console.log(ex);
    }
  },
};
