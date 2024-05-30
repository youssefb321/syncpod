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

const app = express();
const port = 5000;
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

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err) {
      return cb(err);
    }
    cb(null, user);
  });
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

app.get("/auth/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true });
  } else {
    res.json({ isAuthenticated: false });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
