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
      const query = graphql(
        `
          query RandomAnime($pageNo: Int) {
            Page(page: $pageNo, perPage: 1) {
              media(type: ANIME) {
                ...media
              }
            }
          }
        `,
        [mediaFragment]
      );
      const res = await this.graphQlClient.request(query, {
        pageNo,
      });

      if (res.Page?.media && res.Page.media[0]?.isAdult == nsfw)
        return res.Page.media[0];
    }
  }

  async GetRandomCharacterFromList(
    userId: number,
    mediaType: "ANIME" | "MANGA"
  ) {
    const getCharIdsQuery = graphql(`
      query CharIds($userId: Int, $mediaType: MediaType) {
        MediaListCollection(userId: $userId, type: $mediaType) {
          lists {
            entries {
              media {
                characters {
                  nodes {
                    id
                  }
                }
              }
            }
          }
        }
      }
    `);
    const getCharIds = await this.graphQlClient.request(getCharIdsQuery, {
      userId,
      mediaType,
    });
    // Three things will need to select randomly: List, Media and Character
    if (!getCharIds.MediaListCollection?.lists)
      return Error("User doesn't have any List.");

    // First: The List will be selected below
    getCharIds.MediaListCollection.lists =
      getCharIds.MediaListCollection.lists.filter(
        (list) => list?.entries?.length ?? -1 > 0
      );
    if (getCharIds.MediaListCollection.lists.length == 0)
      return Error("All of User's Lists are empty.");
    const list =
      getCharIds.MediaListCollection.lists[
        Math.floor(
          Math.random() * (getCharIds.MediaListCollection.lists.length - 1)
        )
      ];

    // Second: The Media will be selected below
    if (!list?.entries?.length || list.entries.length < 0)
      return Error(
        "Unexpected error occured while processing the selected list"
      );
    list.entries = list.entries.filter(
      (entry) => entry?.media?.characters?.nodes?.length ?? -1 > 0
    );
    const media =
      list.entries[Math.floor(Math.random() * (list.entries.length - 1))]
        ?.media;

    // Third: The Character will be selected below
    if (!media?.characters?.nodes || media.characters.nodes.length < 0)
      return Error(
        "Unexpected error occured while processing the selected media"
      );
    const characterId =
      media.characters.nodes[
        Math.floor(Math.random() * (media.characters.nodes.length - 1))
      ]?.id;
    if (!characterId)
      return Error(
        "Unexpected error occured while processing the selected character"
      );

    const characterInfoQuery = graphql(`
      query CharInfo($id: Int) {
        Character(id: $id) {
          name {
            full
            native
            alternative
            alternativeSpoiler
          }
          image {
            large
          }
          description
          gender
          siteUrl
        }
      }
    `);
    const characterInfo = (
      await this.graphQlClient.request(characterInfoQuery, { id: characterId })
    ).Character;

    if (!characterInfo)
      return Error(
        "Unexpected error occured while fetching the selected character info"
      );

    return characterInfo;
  }

  async GetRandomCharacter() {
    const countQuery = graphql(`
      query Count {
        SiteStatistics {
          characters(perPage: 1, sort: COUNT_DESC) {
            nodes {
              count
            }
          }
        }
      }
    `);
    const countRes = (
      await this.graphQlClient.request(countQuery)
    ).SiteStatistics?.characters?.nodes?.at(0)?.count;
    if (!countRes) throw Error("Unable to get Character Count");

    const pageNo = Math.floor(Math.random() * countRes);

    const charQuery = graphql(`
      query Charac($pageNo: Int) {
        Page(perPage: 1, page: $pageNo) {
          characters {
            name {
              full
              native
              alternative
              alternativeSpoiler
            }
            image {
              large
            }
            description
            gender
            siteUrl
          }
        }
      }
    `);

    const charRes = await this.graphQlClient.request(charQuery, { pageNo });

    return charRes.Page?.characters?.at(0);
  }

  async GetSeasonList(
    season: "WINTER" | "SPRING" | "SUMMER" | "FALL",
    year: number
  ) {
    const query = graphql(
      `
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
              ...media
            }
          }
        }
      `,
      [mediaFragment]
    );

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
    const query = graphql(
      `
        query GetMedia($id: Int) {
          Media(id: $id) {
            ...media
          }
        }
      `,
      [mediaFragment]
    );

    const res = await this.graphQlClient.request(query, { id: animeId });

    return res.Media;
  }

  async GetMediaList(animeIds: number[]) {
    const query = graphql(
      `
        query GetMediaList($ids: [Int]) {
          Page(perPage: 25, page: 1) {
            media(id_in: $ids) {
              ...media
            }
          }
        }
      `,
      [mediaFragment]
    );

    const res = await this.graphQlClient.request(query, { ids: animeIds });

    return res;
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

  async GetAlreadyWatched(
    accessToken: string,
    animeId: number,
    userId: number
  ) {
    const query = graphql(`
      query GetAlreadyWatched($userId: Int, $animeId: Int) {
        MediaList(mediaId: $animeId, userId: $userId, type: ANIME) {
          id
        }
      }
    `);

    const res = await this.graphQlClient
      .request(
        query,
        {
          userId: userId,
          animeId: animeId,
        },
        {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        }
      )
      .catch(() => false);

    return res;
  }

  async AddToWatchlist(accessToken: string, animeId: number) {
    const query = graphql(`
      mutation AddToWatchList($animeId: Int, $startedAt: FuzzyDateInput) {
        SaveMediaListEntry(
          mediaId: $animeId
          status: CURRENT
          startedAt: $startedAt
        ) {
          mediaId
          status
          startedAt {
            day
            month
            year
          }
        }
      }
    `);

    const date = new Date();
    const res = this.graphQlClient.request(
      query,
      {
        animeId,
        startedAt: {
          day: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
        },
      },
      {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      }
    );

    return res;
  }
}

const mediaFragment = graphql(`
  fragment media on Media @_unmask {
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
`);
