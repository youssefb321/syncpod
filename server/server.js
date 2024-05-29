import express from "express";
import { db, registerUser, emailExists, checkLoginpassword } from "./db.js";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:3000" }));

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  checkLoginpassword(email, password, (err, isMatch) => {
    if (err) {
      res.status(500).json({ error: "Failed to check password." });
      return;
    } else if (isMatch) {
      res.status(200).json({ message: "Login successful!" });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  });
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  emailExists(email, (err, rows) => {
    if (err) {
      console.error("Failed to check Email.");
      return;
    } else if (rows >= 1) {
      res.status(400).json({ message: "email already exists" });
      return;
    } else {
      registerUser(email, password, (err, user) => {
        if (err) {
          res.status(500).json({ error: "Failed to register user" });
          return;
        } else {
          res
            .status(200)
            .json({ message: "User registered successfully", user });
        }
      });
      return;
    }
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${5000}`);
});
