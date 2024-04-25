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
import { GetOpAndEd } from "../../../components/ApiRequests";
import { AnimeEmbed } from "../../../components/EmbedTemplates/Anime";

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("suggest")
    .setDescription("Suggest another user in the server anime or manga")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User you want to suggest the media")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("animename")
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
    await i.deferReply({ ephemeral: true });
    const user = i.options.getUser("user", true);
    const animeValue = i.options.getString("animename", true);

    if (user.id === i.user.id) {
      await i.editReply({
        embeds: [SimpleError("You can't suggest anime to yourself.")],
      });
      return;
    }

    try {
      await i.guild?.members.fetch(user);
    } catch (ex) {
      await i.editReply({
        embeds: [
          SimpleError("Unable to find user in this guild."),
        ],
      });
      return;
    }

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

    const AnimeInfo = await client.anilistClient.GetMedia(animeId);
    if (!AnimeInfo) {
      await i.editReply({
        embeds: [SimpleError("Unable to get info about the Anime")],
      });
      return;
    }

    const resObject = AnimeEmbed(AnimeInfo);

    const Resp = await (
      await i.editReply({
        embeds: [
          resObject.embeds[0],
          new EmbedBuilder().setDescription(
            `Do you to suggest this anime to <@${user.id}>`
          ),
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("yes")
              .setLabel("Yes")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId("no")
              .setLabel("No")
              .setStyle(ButtonStyle.Primary)
          ),
        ],
      })
    )
      .awaitMessageComponent({
        time: 60_000,
        componentType: ComponentType.Button,
      })
      .then((i) => i)
      .catch(() => null);

    if (!Resp) {
      await i.editReply({
        embeds: [SimpleError("You took too long to respond")],
        components: [],
      });
      return;
    }

    await i.deleteReply();
    await Resp.deferReply({ ephemeral: true });

    if (Resp.customId === "no") {
      await Resp.editReply({ embeds: [SimpleError("Suggest Cancelled.")] });
      return;
    }

    if (Resp.customId !== "yes") return;

    const suggestions = client.suggestions.get(user.id);

    if (!suggestions)
      client.suggestions.set(user.id, [{ animeId, suggestedAt: Date.now() }]);
    else if(suggestions.filter(suggestion => suggestion.animeId === animeId).length === 0) {
      suggestions.push({ animeId, suggestedAt: Date.now() });
      client.suggestions.set(user.id, suggestions);
    }

    await Resp.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("Successfully Suggested")
          .setDescription(
            `Ask <@${user.id}> to accept the suggestion using the \`/suggestions\` command to add the anime to their anime watch list.`
          ),
      ],
    });

    console.log(client.suggestions.get(user.id));
  },
};
