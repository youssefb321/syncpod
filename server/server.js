import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";
import env from "dotenv";
import connectSqlite3 from "connect-sqlite3";
import GoogleStrategy from "passport-google-oauth20";
import fetch from "node-fetch";
import { Strategy as SpotifyStrategy } from "passport-spotify";
import { searchYoutube } from "./youtube.js";

const app = express();
const port = 5001;
const saltRounds = 10;
env.config();

sqlite3.verbose();

const db = new sqlite3.Database("./syncpod.db");

app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

const SQLiteStore = connectSqlite3(session);

app.use(
  session({
    store: new SQLiteStore({ db: "sessions.db", dir: "./" }),
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy({ usernameField: "email" }, async function verify(
    email,
    password,
    cb
  ) {
    try {
      const user = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
          if (err) {
            console.error("Could not query database:", err);
            reject(err);
          } else {
            resolve(row);
          }
        });
      });

      if (!user) {
        return cb(null, false, { message: "Invalid email or password" });
      }

      const isMatch = await bcrypt.compare(password, user.hash);

      if (isMatch) {
        return cb(null, user);
      } else {
        return cb(null, false, { message: "Invalid email or password" });
      }
    } catch (err) {
      return cb(err);
    }
  })
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5001/auth/google/callback",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const user = await new Promise((resolve, reject) => {
          db.get(
            "SELECT * FROM users WHERE email = ?",
            [profile.emails[0].value],
            (err, row) => {
              if (err) {
                console.error("Could not query database:", err);
                reject(err);
              } else {
                resolve(row);
              }
            }
          );
        });
        if (user) {
          return cb(null, { ...user, accessToken });
        } else {
          const newUser = {
            email: profile.emails[0].value,
            hash: "google",
          };

          db.run(
            "INSERT INTO users (email, hash) VALUES(?, ?)",
            [newUser.email, newUser.hash],
            (err) => {
              if (err) {
                console.error("Could not register user:", err);
                return cb(err);
              } else {
                return cb(null, { ...newUser, accessToken });
              }
            }
          );
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.use(
  new SpotifyStrategy(
    {
      clientID: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      callbackURL: "http://localhost:5001/auth/spotify/callback",
    },
    async (accessToken, refreshToken, expires_in, profile, cb) => {
      try {
        const user = await new Promise((resolve, reject) => {
          db.get(
            "SELECT * FROM users WHERE spotify_id = ?",
            [profile.id],
            (err, row) => {
              if (err) {
                console.error("Could not query database:", err);
                reject(err);
              } else {
                resolve(row);
              }
            }
          );
        });

        if (user) {
          user.accessToken = accessToken;
          return cb(null, user);
        } else {
          const newUser = {
            email: "spotify",
            hash: "spotify",
            spotify_id: profile.id,
          };

          db.run(
            "INSERT INTO users (email, hash, spotify_id) VALUES(?, ?, ?)",
            [newUser.email, newUser.hash, newUser.spotify_id],
            (err, cb) => {
              if (err) {
                console.error("Error: ", err);
                return cb(err);
              } else {
                return cb(null, newUser);
              }
            }
          );
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.serializeUser((user, cb) => {
  // console.log("Serializing user: ", user);
  cb(null, { id: user.id, accessToken: user.accessToken });
});

passport.deserializeUser((obj, cb) => {
  // console.log("Deserializing user: ", obj);
  db.get("SELECT * FROM users WHERE id = ?", [obj.id], (err, user) => {
    if (err) {
      return cb(err);
    }
    cb(null, { ...user, accessToken: obj.accessToken });
  });
});

const refreshSpotifyToken = async (refreshToken) => {
  const url = `https://accounts.spotify.com/api/token`;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: `${process.env.SPOTIFY_CLIENT_ID}`,
    client_secret: `${process.env.SPOTIFY_CLIENT_SECRET}`,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
};

const fetchWithRetry = async (
  url,
  options,
  req,
  retries = 3,
  backoff = 300
) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      } else if (response.status === 401) {
        console.log("Token expired, refreshing...");
        try {
          const newAccessToken = await refreshSpotifyToken(
            req.user.refreshToken
          );

          req.user.accessToken = newAccessToken;

          options.headers.Authorization = `Bearer ${newAccessToken}`;
          response = await fetch(url, options);
        } catch (err) {
          console.error("Failed to refresh access token:", err);
          throw new Error("Could not refresh access token");
        }
      }
      return response;
    } catch (err) {
      if (i === retries - 1) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, backoff));
      backoff *= 2;
    }
  }
};

app.get("/auth/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true });
  } else {
    res.json({ isAuthenticated: false });
  }
});

app.get(
  "/auth/spotify",
  passport.authenticate("spotify", {
    scope: [
      "user-library-read",
      "user-read-playback-state",
      "user-read-recently-played",
      "user-read-playback-position",
      "user-read-currently-playing",
    ],
  })
);

app.get(
  "/auth/spotify/callback",
  passport.authenticate("spotify", {
    failureRedirect: "http://localhost:3000/login",
    successRedirect: "http://localhost:3000/app",
  })
);

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:3000/",
    failureRedirect: "http://localhost:3000/login",
  })
);

app.get("/spotify/podcasts", async (req, res) => {
  if (req.isAuthenticated()) {
    const accessToken = req.user.accessToken;

    try {
      const response = await fetch("https://api.spotify.com/v1/me/shows", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!data.items) {
        throw new Error("Failed to fetch podcast data. No items in response.");
      }

      const podcastData = data.items.map((item) => item.show);
      podcastData.forEach((podcast) => {
        db.run(
          "INSERT OR IGNORE INTO podcasts (id, name, image) VALUES (?, ?, ?)",
          [podcast.id, podcast.name, podcast.images[2].url],
          (err) => {
            if (err) {
              console.error("Error inserting podcasts:", err);
            }
          }
        );
        db.run(
          "INSERT OR IGNORE INTO user_podcasts (podcast_id, user_id) VALUES (?, ?)",
          [podcast.id, req.user.id],
          (err) => {
            if (err) {
              console.error("Error inserting podcasts:", err);
            }
          }
        );
      });

      db.all(
        "SELECT podcasts.id, podcasts.name, podcasts.image FROM podcasts JOIN user_podcasts ON podcasts.id = user_podcasts.podcast_id WHERE user_id = ?",
        [req.user.id],
        (err, rows) => {
          if (err) {
            console.error("Error retrieving podcasts:", err);
            res
              .status(500)
              .json({ error: "Failed to retrieve podcasts from database" });
          } else {
            res.json(rows);
          }
        }
      );

      const getPodcasts = () => {
        return new Promise((resolve, reject) => {
          db.all("SELECT id FROM podcasts", (err, rows) => {
            if (err) {
              return reject(err);
            }
            resolve(rows);
          });
        });
      };

      const rows = await getPodcasts();

      try {
        const epPromises = rows.map(async (row) => {
          try {
            const response = await fetch(
              `https://api.spotify.com/v1/shows/${row.id}/episodes?limit=50`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
              req
            );

            const data = await response.json();

            if (!data.items) {
              throw new Error(`No episodes found for podcast ${row.id}`);
            }

            const episodes = data.items.map((episode) => ({
              id: episode.id,
              name: episode.name,
              podcast_id: row.id,
            }));
            return { episodes };
          } catch (err) {
            console.error(`Failed to fetch episodes for show ${row.id}`, err);
            throw new Error(`Failed to fetch episodes for ${row.id}`);
          }
        });

        // Array of objects containing containing more objects of data on each episode of each show (max. 50 episodes per show)
        const epDetails = await Promise.all(epPromises);

        // Extract episodes into one array
        const allEpisodes = epDetails.flatMap((obj) => obj.episodes);

        // Dynamically build SQL query
        const placeholders = allEpisodes.map(() => "(?, ?, ?)").join(",");
        const sqlQuery = `INSERT OR IGNORE INTO episodes (id, name, podcast_id) VALUES ${placeholders}`;

        // Flatten the array to get the values for placeholders
        const values = allEpisodes.flatMap((episode) => [
          episode.id,
          episode.name,
          episode.podcast_id,
        ]);

        // Execute query
        db.run(sqlQuery, values, (err) => {
          if (err) {
            console.error("Could not insert episodes:", err);
          } else {
            console.log("Episodes inserted successfuly.");
          }
        });
      } catch (err) {
        console.error("Error fetching episodes:", err);
      }
    } catch (err) {
      console.error("Error fetching Spotify podcasts:", err);
      res.status(500).json({ error: "Failed to fetch Spotify podcasts" });
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.get("/spotify/episodes", async (req, res) => {
  if (req.isAuthenticated()) {
    const accessToken = req.user.accessToken;
    console.log("Access Token: ", accessToken);

    try {
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
            return {
              id: episode.id,
              name: episode.name,
              resume_position_ms: episode.resume_point.resume_position_ms,
              podcast_id: row.id,
              user_id: req.user.id,
            };
          });

          return {
            showId: row.id,
            episodes: await Promise.all(episodes),
          };
        } catch (err) {
          console.error(`Failed to fetch episodes for show ${row.name}`, err);
        }
      });

      const episodeDetails = await Promise.all(episodeDetailsPromises);
      console.log(episodeDetails);

      const insertEpisode = (episode) => {
        return new Promise((resolve, reject) => {
          db.run(
            "INSERT OR REPLACE INTO episodes (id, name, podcast_id, user_id, timestamp, youtube_url) VALUES (?, ?, ?, ?, ?)",
            [
              episode.id,
              episode.name,
              episode.podcast_id,
              req.user.id,
              episode.resume_position_ms,
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

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(400).json({ message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(200).json({ message: "Login successful!" });
    });
  })(req, res, next);
});

app.use((req, res, next) => {
  next();
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    const row = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err) {
          console.error("Could not query database:", err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (row) {
      res
        .status(400)
        .json({ message: "Email already exists. Try logging in." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    db.run(
      "INSERT INTO users (email, hash) VALUES(?, ?)",
      [email, hashedPassword],
      (err) => {
        if (err) {
          console.error("Could not register user:", err);
          res.status(500).json({ error: "Could not register user." });
        } else {
          res.status(200).json({ message: "User registered successfully." });
        }
      }
    );
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ error: "An error occurred during registration." });
  }
});

app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Session destruction failed" });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logout successful" });
    });
  });
});

app.post("/spotify/podcasts/episodes", async (req, res) => {
  if (req.isAuthenticated()) {
    const accessToken = req.user.accessToken;

    const { id } = req.body;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/shows/${id}/episodes`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();
      return res.json(data);
    } catch (err) {
      console.error("Error fetching episodes:", err);
      res.status(500).json({ error: "Failed to fetch episodes" });
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.post("/spotify/podcasts", (req, res) => {
  console.log("User authentication status:", req.isAuthenticated());
  console.log("user details:", req.user);

  const { podcastId, switchState } = req.body;

  console.log(`Podcast ID: ${podcastId}, switch state: ${switchState}`);

  if (req.isAuthenticated()) {
    db.run(
      "UPDATE podcasts SET switch_state = ? WHERE id = ? AND user_id = ?",
      [switchState, podcastId, req.user.id],
      (err) => {
        if (err) {
          console.error("Could not update switch state:", err);
          res.status(500).json({ error: "Could not update switch state" });
        }

        res.status(200).json({ message: "Updated switch state successfully" });
        console.log("Successfully updated switch state");
      }
    );
  } else {
    console.log("User is not authenticated");
    res.status(401).json({ message: "User is not authenticated" });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
