export async function GetOpAndEd(animeId: number) {
  try {
    const res = await fetch(
      `https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${animeId}&include=animethemes.animethemeentries.videos,animethemes.song,animethemes.song.artists`
    );
    const json: OpandEdRes = await res.json();
    if (json.anime.length === 0 || !json.anime[0].animethemes)
      return new Error("Unable to get info about the Anime");

    const openings = json.anime[0].animethemes.filter(
      (themes) => themes.type === "OP"
    );
    const endings = json.anime[0].animethemes.filter(
      (themes) => themes.type === "ED"
    );

    return {
      ops: openings.map(
        (op) =>
          `**${op.slug}**: [${
            op.song.title
          }](https://www.youtube.com/results?search_query=${(
            op.song.title +
            " " +
            json.anime[0].name
          )
            .split(" ")
            .join("+")}) ${
            op.song.artists.length != 0
              ? `By __${op.song.artists
                  .map((artist) => artist.name)
                  .join(", ")}__`
              : ""
          } `
      ),
      eds: endings.map(
        (op) =>
          `**${op.slug}**: [${
            op.song.title
          }](https://www.youtube.com/results?search_query=${(
            op.song.title +
            " " +
            json.anime[0].name
          )
            .split(" ")
            .join("+")}) ${
            op.song.artists.length != 0
              ? `By __${op.song.artists
                  .map((artist) => artist.name)
                  .join(", ")}__`
              : ""
          } `
      ),
    };
  } catch (ex) {
    console.log(ex);

    return new Error(
      "Unexpected Error occured while trying to process the network request."
    );
  }
}

interface OpandEdRes {
  anime: {
    name: string;
    animethemes:
      | {
          slug: string;
          type: "ED" | "OP";
          song: { title: string; artists: { name: string }[] };
        }[]
      | null;
  }[];
}
