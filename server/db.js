import sqlite3 from "sqlite3";

sqlite3.verbose();

const db = new sqlite3.Database("./syncpod.db");

function getUsers(callback) {
  db.all("SELECT * FROM users", (err, rows) => {
    if (err) {
      console.error(err);
      callback(err, null);
    } else {
      callback(null, rows);
    }
  });
}

export { db, getUsers };
