import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Vivy } from "../../../Vivy";
import { AnimeEmbed } from "../../../components/EmbedTemplates/Anime";

module.exports = {
  data: new SlashCommandBuilder()
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
