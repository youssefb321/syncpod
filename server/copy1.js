app.get("/spotify/episodes", async (req, res) => {
  if (req.isAuthenticated()) {
    const accessToken = req.user.accessToken;

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
        const response = await fetch(
          `https://api.spotify.com/v1/shows/${row.id}/episodes`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch episodes for show ${row.name}`);
        }

        const data = await response.json();
        const episodes = data.items.map((episode) => ({
          id: episode.id,
          name: episode.name,
          resume_position_ms: episode.resume_point.resume_position_ms,
        }));

        return {
          showId: row.id,
          episodes,
        };
      });

      const episodeDetails = await Promise.all(episodeDetailsPromises);

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
