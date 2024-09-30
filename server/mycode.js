app.get("/spotify/episodes", async (req, res) => {
  if (req.isAuthenticated()) {
    const accessToken = req.user.accessToken;
    console.log("Access Token: ", accessToken);

    try {
      const getPodcasts = () => {
        return new Promise((resolve, reject) => {
          db.all(
            "SELECT id, name FROM podcasts WHERE switch_state = 'ON' AND user_id = ?",
            [req.user.id],
            (err, rows) => {
              if (err) {
                return reject(err);
              }
              resolve(rows);
            }
          );
        });
      };

      const rows = await getPodcasts();

      const episodeDetailsPromises = rows.map(async (row) => {
        try {
          const response = await fetchWithRetry(
            `https://api.spotify.com/v1/shows/${row.id}/episodes`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            },
            req
          );

          const data = await response.json();
          const episodes = data.items.map(async (episode) => {
            let youtubeUrl = null;
            let updatedUrl = null;
            try {
              youtubeUrl = await searchYoutube(`${episode.name}`);
              updatedUrl = `${youtubeUrl}&t=${Math.floor(
                episode.resume_position_ms / 1000
              )}`;
            } catch (err) {
              console.error(
                `YouTube search failed for episode ${episode.name}`,
                err
              );
            }

            return {
              id: episode.id,
              name: episode.name,
              resume_position_ms: episode.resume_point.resume_position_ms,
              podcast_id: row.id,
              user_id: req.user.id,
              youtube_url: youtubeUrl,
              updated_url: updatedUrl,
            };
          });

          return {
            showId: row.id,
            episodes: await Promise.all(episodes),
          };
        } catch (err) {
          console.error(`Failed to fetch episodes for show ${row.name}`, err);
          throw new Error(`Failed to fetch episodes for ${row.name}`);
        }
      });

      const episodeDetails = await Promise.all(episodeDetailsPromises);
      console.log(episodeDetails);

      const insertEpisode = (episode) => {
        return new Promise((resolve, reject) => {
          db.run(
            "INSERT OR REPLACE INTO episodes (id, name, podcast_id, user_id, timestamp, youtube_url, updatedUrl) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              episode.id,
              episode.name,
              episode.podcast_id,
              req.user.id,
              episode.resume_position_ms,
              episode.youtube_url,
              episode.updated_Url,
            ],
            (err) => {
              if (err) {
                console.error("Could not insert episode:", err);
                return reject(err);
              }
              resolve();
            }
          );
        });
      };

      const insertEpisodesPromises = episodeDetails.flatMap((details) =>
        details.episodes.map(insertEpisode)
      );

      await Promise.all(insertEpisodesPromises);

      res.status(200).json({ episodeDetails });
    } catch (err) {
      console.error("Error fetching episodes from Spotify:", err);
      res.status(500).json({ error: "Failed to fetch episodes from Spotify" });
    }
  } else {
    console.log("User not authenticated");
    res.status(401).json({ error: "User not authenticated" });
  }
});
