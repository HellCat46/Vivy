import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { Vivy } from "../../../Vivy";
import { SimpleError } from "../../../components/EmbedTemplates/Error";
import { AnimeEmbed } from "../../../components/EmbedTemplates/Anime";
import { GetOpAndEd } from "../../../components/ApiRequests";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("season")
    .setDescription("Get List of Anime Airing in specific Season")
    .addStringOption((option) =>
      option
        .setName("season")
        .setDescription("Anime Season")
        .setRequired(true)
        .addChoices(
          { name: "Winter", value: "WINTER" },
          { name: "Spring", value: "SPRING" },
          { name: "Summer", value: "SUMMER" },
          { name: "Fall", value: "FALL" }
        )
    )
    .addNumberOption((option) =>
      option
        .setName("year")
        .setDescription("Year")
        .setRequired(true)
        .setMinValue(1900)
    ),
  async execute(client: Vivy, i: ChatInputCommandInteraction) {
    i.deferReply();
    const season = i.options.getString("season", true);
    const year = i.options.getNumber("year", true);

    if (
      !(
        season === "WINTER" ||
        season === "SPRING" ||
        season === "SUMMER" ||
        season === "FALL"
      )
    ) {
      await i.editReply({
        embeds: [
          SimpleError("Invalid Season Input. Please report it to Bot Owner"),
        ],
      });
      return;
    }

    const animes = (
      await client.anilistClient.GetSeasonList(season, year)
    ).filter((anime) => anime);
    if (animes.length === 0) {
      await i.editReply({
        embeds: [SimpleError(`No Anime was released in ${season} ${year}`)],
      });
      return;
    }

    const msgObjects: {
      embed: EmbedBuilder;
      component: ActionRowBuilder<ButtonBuilder>;
    }[] = [];

    for (const anime of animes) {
      if (anime == null) continue;

      
      const obj = AnimeEmbed(anime);
      msgObjects.push({ embed: obj.embeds[0], component: obj.components[0] });
    }

    const pageMove = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("back")
        .setLabel("Back")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary)
    );

    let pageNo = 0;
    const collector = (
      await i.editReply({
        embeds: [msgObjects[pageNo].embed],
        components: [msgObjects[pageNo].component, pageMove],
      })
    ).createMessageComponentCollector({
      time: 300_000,
      filter: (int) => int.user.id === i.user.id,
      componentType: ComponentType.Button,
    });

    collector.on("collect", (int) => {
      if (int.customId === "next" && pageNo + 1 < msgObjects.length) {
        pageNo++;
        int.update({
          embeds: [msgObjects[pageNo].embed],
          components: [msgObjects[pageNo].component, pageMove],
        });
      } else if (int.customId === "back" && pageNo > 0) {
        pageNo--;
        int.update({
          embeds: [msgObjects[pageNo].embed],
          components: [msgObjects[pageNo].component, pageMove],
        });
      }
    });

    collector.on("end", () => {
      i.editReply({
        embeds: [msgObjects[pageNo].embed],
        components: [msgObjects[pageNo].component],
      });
    });
  },
};
