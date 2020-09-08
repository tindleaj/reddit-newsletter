const REDDIT_BASE_URL = "https://reddit.com/r";

// We set the 'onmessage' event handler here, per the WebWorkers API:
// https://developer.mozilla.org/en-US/docs/Web/API/Worker/onmessage
// @ts-ignore
onmessage = async (event: MessageEvent) => {
  const [id, name, email, sendtime, active, subreddits] = event.data;

  const sections = await fetchAndParseSections(subreddits, 3);

  const payload: Payload = {
    title: "Reddit Newsletter",
    message: `Hello ${name},\nSee top voted posts from your favorite channels.`,
    sections,
  };

  console.log(JSON.stringify(payload, null, 2));
};

const fetchAndParseSections = async (
  subreddits: string,
  total: number,
): Promise<Array<Section>> => {
  let sections = JSON.parse(subreddits).map(async (sub: any) => {
    const res = await fetch(`${REDDIT_BASE_URL}/${sub}/top.json`);
    const body = await res.json();

    const posts = body.data.children
      .filter((post: any) => !post.data.over_18) // No NSFW!
      .slice(0, total)
      .map((post: any) => ({
        votes: post.data.ups,
        title: post.data.title,
        url: post.data.url,
        imageUrl: post.data.thumbnail,
      }));

    return {
      name: sub,
      url: `${REDDIT_BASE_URL}/${sub}/top`,
      posts,
    };
  });

  return await Promise.all(sections);
};

interface Payload {
  title: string;
  message: string;
  sections: Array<Section>;
}

interface Section {
  name: string;
  url: string;
  posts: Array<PostData>;
}

interface PostData {
  votes: number;
  title: string;
  url: string;
  imageUrl: string;
}
