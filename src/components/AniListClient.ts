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
  async GetRandomMedia(nsfw: boolean) {
    const countQuery = graphql(`
      query Count {
        SiteStatistics {
          anime(sort: COUNT_DESC) {
            nodes {
              count
            }
          }
          manga(sort: COUNT_DESC) {
            nodes {
              count
            }
          }
        }
      }
    `);
    const countRes = await this.graphQlClient.request(countQuery);

    const animeCount = countRes.SiteStatistics?.anime?.nodes;
    const mangaCount = countRes.SiteStatistics?.manga?.nodes;
    if (
      !(animeCount instanceof Array) ||
      !(mangaCount instanceof Array) ||
      animeCount[0]?.count == undefined ||
      mangaCount[0]?.count == undefined
    )
      throw new Error("Unable to Get Media Count");

    const animeId = Math.floor(Math.random() * animeCount[0].count);
    //const mangaId = Math.floor(Math.random() * mangaCount[0].count);

    const query = graphql(`
      query RandomAnime($id: Int, $nsfw: Boolean) {
        Media(id: $id, isAdult: $nsfw) {
          id
          title {
            english
          }
        }
      }
    `);
    const res = await this.graphQlClient.request(query, {
      nsfw: nsfw,
      id: animeId,
    });

    return res.Media;
  }

  async GetSeasonList(
    season: "WINTER" | "SPRING" | "SUMMER" | "FALL",
    year: number
  ) {
    const query = graphql(`
      query SeasonList($season: MediaSeason, $seasonYear: Int) {
        Page {
          media(season: $season, seasonYear: $seasonYear, type: ANIME) {
            id
            title {
              english
              native
            }
            type
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
            countryOfOrigin
            source
            trailer {
              site
            }
            coverImage {
              extraLarge
            }
            genres
            meanScore
            tags {
              name
            }
          }
        }
      }
    `);

    const res = await this.graphQlClient.request(query, {
      season: season,
      seasonYear: year,
    });

    return res.Page?.media;
  }

  async GetAiringToday() {
    const datetime = new Date();
    const startTimestamp = Math.floor((datetime.setHours(0, 0, 0, 0) - 1)/1000);
    const endTimestamp = Math.ceil((datetime.setHours(24) + 1)/1000);
    
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
