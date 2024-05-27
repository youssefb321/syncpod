import express from "express";
import { db, registerUser } from "./db.js";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors({ origin: "http://localhost:3000" }));

app.get("/", (req, res) => {
  console.log("/");
});

app.get("/register", (req, res) => {
  console.log("register");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  console.log("Received registration request: ", email);

  registerUser(email, password, (err, user) => {
    if (err) {
      res.status(500).json({ error: "Failed to register user" });
      return;
    } else {
      res.status(200).json({ message: "User registered successfully", user });
    }
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${5000}`);
});
