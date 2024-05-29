import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import sqlite3 from "sqlite3";
import env from "dotenv";

const app = express();
const port = 5000;
const saltRounds = 10;
env.config();

sqlite3.verbose();

const db = new sqlite3.Database("./syncpod.db");

app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
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
    // console.log(username);

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
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
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
    res.status(500).json({ error: "An error occured during registration." });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${5000}`);
});
