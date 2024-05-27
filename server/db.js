import sqlite3 from "sqlite3";
import bcrypt from "bcrypt";

sqlite3.verbose();

const db = new sqlite3.Database("./syncpod.db");

const registerUser = async (email, password, callback) => {
  const saltRounds = 10;
  try {
    console.log("hashing password...");
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("password hashed: ", hashedPassword);

    const query = "INSERT INTO users (email, hash) VALUES(?, ?)";
    console.log("Inserting into database...");

    db.run(query, [email, hashedPassword], function (err) {
      if (err) {
        console.error("Could not register user: ", err.message);
        callback(err);
      } else {
        callback(null, { id: this.lastID, email, password });
      }
    });
  } catch (err) {
    console.error("Hashing error: ", err);
    callback(err);
  }
};

export { db, registerUser };
