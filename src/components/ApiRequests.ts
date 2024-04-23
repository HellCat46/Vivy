export async function GetOpAndEd(animeId: number) {
  try {
    const res = await fetch(
      `https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=AniList&filter[external_id]=${animeId}&include=animethemes.animethemeentries.videos,animethemes.song,animethemes.song.artists`
    );
    const json: OpandEdRes = await res.json();

    return json;
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
          animethemeentries: { episodes: string }[];
        }[]
      | null;
  }[];
}
