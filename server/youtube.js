import fetch from "node-fetch";

export const searchYoutube = async (query) => {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    query
  )}&type=video&key=${process.env.GOOGLE_API_KEY}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from YouTube API: ${response.statusText}`);
  }
  const data = await response.json();

  if (data.items && data.items.length > 0) {
    const videoId = data.items[0].id.videoId;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return videoUrl;
  } else {
    throw new Error("No matching Youtube video found");
  }
};
