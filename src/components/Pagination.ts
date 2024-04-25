import {
    APIEmbedField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
} from "discord.js";

export async function EmbedPagnination(i: ChatInputCommandInteraction, embed: EmbedBuilder, pages : APIEmbedField[][]) {
    let pageNo = 0;
    embed.setFields(pages[pageNo]);


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

  if (pages.length === 1) {
    await i.editReply({ embeds: [embed] });
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
}
