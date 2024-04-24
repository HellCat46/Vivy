import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { Vivy } from "../../../Vivy";
import { SimpleError } from "../../../components/EmbedTemplates/Error";
import { AnimeEmbed } from "../../../components/EmbedTemplates/Anime";
import { scheduleJob } from "node-schedule";

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("search")
    .setDescription("Search for an anime")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the Anime")
        .setRequired(true)
        .setAutocomplete(true)
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

    const anime = await client.anilistClient.GetMedia(animeId);
    if (!anime) {
      await i.editReply({
        embeds: [
          SimpleError(`Unable to find any Anime with Name "${animeValue}"`),
        ],
      });
      return;
    }

    const ReplyObj = AnimeEmbed(anime);
    if (!anime.nextAiringEpisode) {
      await i.editReply(ReplyObj);
      return;
    }

    ReplyObj.components.push(
      new ActionRowBuilder<ButtonBuilder>({
        components: [
          new ButtonBuilder()
            .setCustomId("notify")
            .setLabel("Get Notify for Next Ep")
            .setStyle(ButtonStyle.Primary),
        ],
      })
    );

    const res = await (
      await i.editReply(ReplyObj)
    )
      .awaitMessageComponent({
        filter: (inter) => inter.user.id === i.user.id,
        time: 60_000,
        componentType: ComponentType.Button,
      })
      .then((inter) => inter)
      .catch(() => null);

    ReplyObj.components.pop();
    if (res == null) {
      await i.editReply(ReplyObj);
      return;
    }
    res.update(ReplyObj);

    if (client.jobManager.get({ userId: i.user.id, showId: anime.id })) {
      await i.followUp({
        embeds: [
          SimpleError(
            "You have already signed up for this show's notification."
          ),
        ],
        ephemeral: true,
      });
      return;
    }

    const func = async () => {
      try {
        await i.user.send({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                `New Episode of Anime \`${
                  ReplyObj.embeds[0].toJSON().title
                }\` is out.`
              )
              .setTimestamp()
              .setColor("Green")
              .setThumbnail(anime.coverImage?.extraLarge ?? null)
              .setImage(anime.bannerImage),
          ],
        });
      } catch (_) {}
    };
    const job = scheduleJob(new Date(anime.nextAiringEpisode.airingAt), func);

    try {
      await i.user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              `You will be notified when next episode of ${
                ReplyObj.embeds[0].toJSON().title
              } will air.`
            )
            .setColor("Green")
            .setTimestamp(),
        ],
      });
    } catch (_) {
      await i.followUp({
        embeds: [
          SimpleError("Bot is not allowed to Send Direct Message to you."),
        ],
        ephemeral: true,
      });
      job.cancel();
      return;
    }

    client.jobManager.set({ userId: i.user.id, showId: anime.id }, job);
    console.log(client.jobManager.keys());
  },
};
