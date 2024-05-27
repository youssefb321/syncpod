import express from "express";
import { db, getUsers } from "./db.js";

const app = express();
const port = 5000;

app.use(express.json());

app.get("/", (req, res) => {
  getUsers((err, users) => {
    if (err) {
      res.status(500).json({ error: "Database error" });
    } else {
      res.json(users);
    }
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${5000}`);
});
