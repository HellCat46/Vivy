import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function AnimeEmbed(
  data: AnimeFields,
) {
  const langList = getLangList(data);

  const embed = new EmbedBuilder()
    .setTitle(
      data.title?.romaji ?? data.title?.english ?? data.title?.native ?? null
    )
    .setURL(`https://anilist.co/anime/${data.id}`)
    .setThumbnail(data.coverImage?.extraLarge ?? null)
    .setImage(data.bannerImage)
    .setTimestamp()
    .setFooter({ text: "Source: Anilist" });

  if (data.coverImage?.color) {
    embed.setColor(`#${data.coverImage.color.slice(1)}`);
  }

  embed.setDescription(
    ` 
      ${
        data.title?.english
          ? `**English Title: __${data.title.english}__**`
          : ""
      }
      ${
        data.description
          ? data.description.length > 1000
            ? data.description.slice(0, 1000) + "..."
            : data.description
          : " "
      }\n\n\n 
      ${
        data.nextAiringEpisode
          ? `__The next episode(Ep. ${data.nextAiringEpisode.episode}) will air <t:${data.nextAiringEpisode.airingAt}:R>__`
          : ""
      }
      **Score**: ${data.meanScore ?? data.averageScore ?? "Unknown"}/100
      **Status**: ${data.status ?? "Unknown"}${
      data.source ? `**\nMedia Source:** ${data.source}` : ""
    }${data.episodes ? `\n**Episode Count:** ${data.episodes}` : ""}${
      data.duration ? `\n**Episode Duration:** ${data.duration} Minutes` : ""
    }${
      langList.length != 0 ? `\n**Available In:** ${langList.filter((lang, idx)=> langList.indexOf(lang) === idx).toString()}` : ""
    }${
      data.startDate?.year
        ? `\n**Started:** ${
            data.startDate.month ? `${months[data.startDate.month - 1]}` : ""
          } ${data.startDate.day ? `${data.startDate.day}, ` : ""}${
            data.startDate.year
          }`
        : ""
    }${
      data.endDate?.year
        ? `\n**Ended:** ${
            data.endDate.month ? `${months[data.endDate.month - 1]}` : ""
          } ${data.endDate.day ? `${data.endDate.day}, ` : ""}${
            data.endDate.year
          }`
        : ""
    }${
      data.genres && data.genres.length != 0
        ? `\n**Genres:** ${data.genres.toString()}`
        : ""
    }
  `
  );

  const component = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(`https://anilist.co/anime/${data.id}`)
      .setLabel("Anilist Link")
  );

  if (data.idMal)
    component.addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(`https://myanimelist.net/anime/${data.idMal}`)
        .setLabel("MAL Link")
    );
  if (data.trailer?.site && data.trailer.id)
    component.addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(
          (data.trailer.site === "youtube"
            ? "https://www.youtube.com/watch?v="
            : "https://www.dailymotion.com/video/") + data.trailer.id
        )
        .setLabel("Trailer Link")
    );

    
return { embeds: [embed], components: [component] };

}

export function getLangList(data: AnimeFields) {
  if (!data.characters?.edges || !data.characters.edges[0]?.voiceActorRoles)
    return [];

  const language: string[] = [];
  for (const vaRole of data.characters.edges[0].voiceActorRoles) {
    if (!vaRole?.voiceActor?.language) continue;

    language.push(" " + vaRole.voiceActor.language);
  }
  return language;
}

interface AnimeFields {
  id: number;
  idMal: number | null;
  title: {
    native: string | null;
    english: string | null;
    romaji: string | null;
  } | null;
  description: string | null;
  coverImage: { color: string | null; extraLarge: string | null } | null;
  bannerImage: string | null;
  averageScore: number | null;
  meanScore: number | null;
  status: string | null;
  trailer: { site: string | null; id: string | null } | null;
  source: string | null;
  duration: number | null;
  episodes: number | null;
  endDate: {
    day: number | null;
    month: number | null;
    year: number | null;
  } | null;
  startDate: {
    day: number | null;
    month: number | null;
    year: number | null;
  } | null;
  genres: (string | null)[] | null;
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  characters: {
    edges:
      | ({
          node: {
            id: number;
          } | null;
          voiceActorRoles:
            | ({
                voiceActor: {
                  language: string | null;
                } | null;
              } | null)[]
            | null;
        } | null)[]
      | null;
  } | null;
}
