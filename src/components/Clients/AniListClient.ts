import { GraphQLClient } from "graphql-request";
import { graphql } from "gql.tada";


export class AniListClient {
  graphQlClient: GraphQLClient;
  ClientSecret: string;
  ClientId: string;
  constructor(ClientSecret: string, ClientId: string) {
    this.graphQlClient = new GraphQLClient("https://graphql.anilist.co");
    this.ClientSecret = ClientSecret;
    this.ClientId = ClientId;
  }
  async GetRandomAnime(nsfw: boolean) {
    while (true) {
      const countQuery = graphql(`
        query Count {
          SiteStatistics {
            anime(perPage: 1, sort: COUNT_DESC) {
              nodes {
                count
              }
            }
          }
        }
      `);
      const countRes = await this.graphQlClient.request(countQuery);

      const animeCount = countRes.SiteStatistics?.anime?.nodes;
      if (!(animeCount instanceof Array) || animeCount[0]?.count == undefined)
        throw new Error("Unable to Get Media Count");

      const animeId = Math.floor(Math.random() * animeCount[0].count);
      const query = graphql(`
        query RandomAnime($id: Int) {
          Page(page: $id, perPage: 1) {
            media(type: ANIME) {
              id
              idMal
              isAdult
              title {
                english
                native
                romaji
              }
              status
              description
              startDate {
                year
                month
                day
              }
              endDate {
                year
                month
                day
              }
              episodes
              duration
              source
              trailer {
                site
                id
              }
              coverImage {
                extraLarge
                color
              }
              bannerImage
              genres
              meanScore
              averageScore
              tags {
                name
                isMediaSpoiler
                isAdult
              }
              nextAiringEpisode {
                episode
                airingAt
              }
            }
          }
        }
      `);
      const res = await this.graphQlClient.request(query, {
        id: animeId,
      });

      if (res.Page?.media && res.Page.media[0]?.isAdult == nsfw) return res.Page.media[0];
    }
  }

  async GetSeasonList(
    season: "WINTER" | "SPRING" | "SUMMER" | "FALL",
    year: number
  ) {
    const query = graphql(`
      query SeasonList(
        $season: MediaSeason
        $seasonYear: Int
        $format: MediaFormat
        $excludeformat: MediaFormat
      ) {
        Page(perPage: 50) {
          media(
            season: $season
            seasonYear: $seasonYear
            type: ANIME
            format: $format
            format_not: $excludeformat
          ) {
            id
            idMal
            isAdult
            title {
              english
              native
              romaji
            }
            status
            description
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            episodes
            duration
            source
            trailer {
              site
              id
            }
            coverImage {
              extraLarge
              color
            }
            bannerImage
            genres
            meanScore
            averageScore
            tags {
              name
              isMediaSpoiler
              isAdult
            }
            nextAiringEpisode {
              episode
              airingAt
            }
          }
        }
      }
    `);

    const TVList = (
      await this.graphQlClient.request(query, {
        season: season,
        seasonYear: year,
        format: "TV",
      })
    ).Page?.media;
    const ExcludeTVList = (
      await this.graphQlClient.request(query, {
        season: season,
        seasonYear: year,
        excludeformat: "TV",
      })
    ).Page?.media;

    if (TVList && ExcludeTVList) {
      TVList.push(...ExcludeTVList);
      return TVList;
    } else if (TVList && !ExcludeTVList) return TVList;
    else if (!TVList && ExcludeTVList) return ExcludeTVList;
    else return [];
  }

  async GetAiringToday() {
    const datetime = new Date();
    const startTimestamp = Math.floor(
      (datetime.setHours(0, 0, 0, 0) - 1) / 1000
    );
    const endTimestamp = Math.ceil((datetime.setHours(24) + 1) / 1000);

    const query = graphql(`
      query GetAiring($start: Int, $end: Int) {
        Page {
          airingSchedules(
            airingAt_greater: $start
            airingAt_lesser: $end
            sort: TIME
          ) {
            id
            airingAt
            timeUntilAiring
            episode
            media {
              title {
                english
                romaji
              }
            }
          }
        }
      }
    `);

    const res = await this.graphQlClient.request(query, {
      start: startTimestamp,
      end: endTimestamp,
    });

    return res.Page?.airingSchedules;
  }
}
