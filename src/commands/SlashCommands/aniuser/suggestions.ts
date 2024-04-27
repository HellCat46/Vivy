import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CacheType,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  Interaction,
  SlashCommandSubcommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { Vivy } from "../../../Vivy";
import { SimpleError } from "../../../components/EmbedTemplates/Error";
import { AnimeEmbed } from "../../../components/EmbedTemplates/Anime";

module.exports = {
  data: new SlashCommandSubcommandBuilder()
    .setName("suggestions")
    .setDescription("List of suggested media suggested by other users"),
  async execute(client: Vivy, i: ChatInputCommandInteraction) {
    await i.deferReply({ ephemeral: true });

    const accessToken = client.accessTokens.get(i.user.id);
    const suggestions = client.suggestions.get(i.user.id);

    if (!accessToken) {
      await i.editReply({
        embeds: [
          SimpleError(
            "Please login in with anilist before performing this action"
          ),
        ],
      });
      return;
    }
    if (!suggestions) {
      await i.editReply({
        embeds: [SimpleError("You don't have any suggestions.")],
      });
      return;
    }

    const animes = (
      await client.anilistClient.GetMediaList(
        suggestions.map((sugg) => sugg.animeId)
      )
    ).Page?.media;
    if (!animes) {
      await i.editReply({
        embeds: [
          SimpleError("Failed to fetch info about the suggested anime."),
        ],
      });
      return;
    }

    const baseEmbed = new EmbedBuilder()
      .setTitle("Suggestions")
      .setDescription(
        "Use Selection Menu to get extra info about a specfic anime from the list or... just use button to mass accept or reject the suggestions."
      )
      .setTimestamp();
    const selectionMenu = new StringSelectMenuBuilder().setCustomId(
      "selectMenu"
    );

    for (let idx = 0; idx < suggestions.length; idx++) {
      baseEmbed.addFields({
        name: idx + 1 + ". " + suggestions[idx].animeName,
        value: `Suggested By: ${suggestions[idx].suggestedBy}`,
      });
      selectionMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setValue(`${suggestions[idx].animeId}`)
          .setLabel(idx + 1 + ". " + suggestions[idx].animeName)
          .setDescription(`Suggested By: <@${suggestions[idx].suggestedBy}>`)
      );
    }

    const collector = (
      await i.editReply({
        embeds: [baseEmbed],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("acceptAll")
              .setLabel("Accept All")
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("rejectAll")
              .setLabel("Reject All")
              .setStyle(ButtonStyle.Danger)
          ),
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            selectionMenu
          ),
        ],
      })
    ).createMessageComponentCollector({ time: 60_000 });

    let Action: boolean | number;
    collector.on("collect", async (inter) => {
      try {
      if (inter.isButton()) {
        if (inter.customId === "acceptAll") {
          Action = true;
        } else if (inter.customId === "rejectAll") {
          Action = false;
        }

        collector.stop();
      }
      if (inter.isStringSelectMenu()) {
        await inter.deferReply({ ephemeral: true });
        const animeId = +inter.values[0];

        const anime = animes.find((anime) => anime?.id === animeId);
        if (!anime) {
          await inter.editReply({
            embeds: [SimpleError("Unable to get info about the Anime")],
          });
          return;
        }

        const msgObj = AnimeEmbed(anime);
        msgObj.embeds.push(
          new EmbedBuilder()
            .setTitle("Confirmation")
            .setColor("Grey")
            .setTimestamp()
            .setDescription(
              "Are you sure you want to add this anime to your watch list?"
            )
        );
        msgObj.components.push(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel("Yes")
              .setCustomId("yes")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setLabel("No")
              .setCustomId("no")
              .setStyle(ButtonStyle.Primary)
          )
        );
        const res = await (
          await inter.editReply(msgObj)
        )
          .awaitMessageComponent({
            time: 60_000,
            componentType: ComponentType.Button,
          })
          .then((i) => i)
          .catch(() => null);

        await inter.editReply({ embeds: [msgObj.embeds[0]], components: [] });
        if (!res || res.customId === "no") return;

        collector.stop();
        Action = animeId;
      }
      }catch(ex){
        console.error(ex);
      }
    });

    collector.once("end", async () => {
      await i.editReply({ components: [] });
      if (typeof Action === "number") {
        try {
          const res = await client.anilistClient.AddToWatchlist(
            accessToken.access_token,
            Action
          );
          client.suggestions.set(
            i.user.id,
            suggestions.filter(
              (sugg) => sugg.animeId !== res.SaveMediaListEntry?.mediaId
            )
          );

          await i.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle("Success")
                .setColor("Green")
                .setTimestamp()
                .setDescription("Successfully Added Anime to Watchlist."),
            ],
          });
        } catch (ex) {
          await i.editReply({
            embeds: [
              SimpleError(
                "Unexpected Error occured while trying to process the request."
              ),
            ],
          });
        }

      } else if (Action) {
        const animeIds = suggestions.map((sugg) => sugg.animeId);
        const addedAnimes = [];

        for (const animeId of animeIds) {
          try {
            await client.anilistClient.AddToWatchlist(
              accessToken.access_token,
              animeId
            );
            addedAnimes.push(animeId);
          } catch (ex) {}
        }

        await i.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Success")
              .setColor("Green")
              .setTimestamp()
              .setDescription(
                `Successfully added ${addedAnimes.length} anime('s) out of ${animeIds.length}.`
              ),
          ],
        });
      } else if (Action == false) {
        client.suggestions.delete(i.user.id);
        i.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Successfully Cleared the Suggestion List")
              .setColor("Green"),
          ],
        });
      }
    });
  },
};
