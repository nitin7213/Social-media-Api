import { db } from "../connect.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET; // Ensure you set this in your .env file

export const register = async (req, res) => {
  const { username, email, password, name } = req.body;

  try {
    // Check if user exists
    const [rows] = await db.execute("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (rows.length) return res.status(409).json("User already exists!");

    // Hash the password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Insert new user
    const [insertedRow] = await db.execute(
      "INSERT INTO users (`username`,`email`,`password`,`name`) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, name]
    );

    return res.status(201).json("User has been created.");
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Verify user
    const [rows] = await db.execute("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (rows.length === 0) return res.status(404).json("User not found!");

    const user = rows[0]; //db fetch
    // Check password
    const checkPassword = bcrypt.compareSync(password, user.password);
    if (!checkPassword)
      return res.status(400).json("Wrong password or username!");

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: "1h" });

    const { password: pwd, ...others } = user; //destructuring

    res
      .cookie("accessToken", token, {
        httpOnly: true,
        secure: true, // for https
        sameSite: "strict", // Not accessed by other site
      })
      .status(200)
      .json(others);
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("accessToken").status(200).json("User has been logged out.");
};
