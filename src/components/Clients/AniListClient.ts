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

      const pageNo = Math.floor(Math.random() * animeCount[0].count);
      const query = graphql(`
        query RandomAnime($pageNo: Int) {
          Page(page: $pageNo, perPage: 1) {
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
              nextAiringEpisode {
                episode
                airingAt
              }
              characters(page: 1, sort: [ROLE, RELEVANCE, ID]) {
                edges {
                  voiceActorRoles(sort: [RELEVANCE, ID]) {
                    voiceActor {
                      language: languageV2
                    }
                  }
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      `);
      const res = await this.graphQlClient.request(query, {
        pageNo,
      });

      if (res.Page?.media && res.Page.media[0]?.isAdult == nsfw)
        return res.Page.media[0];
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
            nextAiringEpisode {
              episode
              airingAt
            }
            characters(page: 1, sort: [ROLE, RELEVANCE, ID]) {

              edges {
                voiceActorRoles(sort: [RELEVANCE, ID]) {
                  voiceActor {
                    language: languageV2
                  }
                }
                node {
                  id
                }
              }
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

  async SearchAnime(name: string, count: number) {
    const query = graphql(`
      query SearchAnime($name: String, $perPage: Int) {
        Page(page: 1, perPage: $perPage) {
          media(search: $name, type: ANIME, isAdult: false) {
            title {
              romaji
              english
              native
            }
            id
          }
        }
      }
    `);

    const res = await this.graphQlClient.request(query, {
      name,
      perPage: count,
    });

    return res.Page?.media;
  }

  async GetMedia(animeId: number) {
    const query = graphql(`
      query GetMedia($id: Int) {
        Media(id: $id) {
          id
          idMal
          isAdult
          title {
            english
            native
            romaji
          }
          status
          description(asHtml: false)
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
          nextAiringEpisode {
            episode
            airingAt
          }

          characters(page: 1, sort: [ROLE, RELEVANCE, ID]) {
            edges {
              voiceActorRoles(sort: [RELEVANCE, ID]) {
                voiceActor {
                  language: languageV2
                }
              }
              node {
                id
              }
            }
          }
        }
      }
    `);

    const res = await this.graphQlClient.request(query, { id: animeId });

    return res.Media;
  }

  async SearchNSFW(name: string, count: number) {
    const query = graphql(`
      query SearchAnime($name: String, $perPage: Int) {
        Page(page: 1, perPage: $perPage) {
          media(search: $name, isAdult: true) {
            title {
              romaji
              english
              native
            }
            id
            type
          }
        }
      }
    `);

    const res = await this.graphQlClient.request(query, {
      name,
      perPage: count,
    });

    return res.Page?.media;
  }
}
