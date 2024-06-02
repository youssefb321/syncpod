import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:5000/auth/google/callback"
);

export const getYoutubeHistory = async (accessToken) => {
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const service = google.youtube("v3");
  const response = await service.playlistItems.list({
    part: "snipper,contentDetails",
    playlistId: "HL",
    maxResults: 10,
    auth: oauth2Client,
  });

  console.log(response.data.items);

  return response.data.items;
};
