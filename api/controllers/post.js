import { db } from "../connect.js";
import jwt from "jsonwebtoken";
import moment from "moment";

export const getPosts = async (req, res) => {
  const userId = req.query.userId;
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET);

    let q;
    let values;

    if (userId) {
      q = `SELECT p.*, u.id AS userId, name, profilePic FROM posts AS p JOIN users AS u ON (u.id = p.userId) WHERE p.userId = ? ORDER BY p.createdAt DESC`;
      values = [userId];
    } else {
      q = `SELECT p.*, u.id AS userId, name, profilePic FROM posts AS p JOIN users AS u ON (u.id = p.userId) LEFT JOIN relationships AS r ON (p.userId = r.followedUserId) 
           WHERE r.followerUserId = ? OR p.userId = ? ORDER BY p.createdAt DESC`;
      values = [userInfo.id, userInfo.id];
    }

    const [data] = await db.execute(q, values);

    return res.status(200).json(data);
  } catch (err) {
    return res.status(403).json({ message: "Token is not valid!" });
  }
};

export const addPost = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET);
    const { desc, img } = req.body;
    if (!desc) return res.status(400).json("Post description is required!");

    const createdAt = moment().format("YYYY-MM-DD HH:mm:ss");

    const q =
      "INSERT INTO posts(`desc`, `img`, `createdAt`, `userId`) VALUES (?, ?, ?, ?)";
    const values = [desc, img, createdAt, userInfo.id];

    const [data] = await db.execute(q, values);

    if (data.affectedRows > 0) {
      return res.status(201).json("Post has been created.");
    } else {
      return res.status(500).json("Internal server error");
    }
  } catch (err) {
    return res.status(403).json("Token is not valid!");
  }
};

export const deletePost = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ message: "Not logged in!" });

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET);
    const q = "DELETE FROM posts WHERE `id` = ? AND `userId` = ?";
    const [data] = await db.execute(q, [req.params.id, userInfo.id]);

    if (data.affectedRows > 0) {
      return res.status(200).json({ message: "Post has been deleted." });
    } else {
      return res
        .status(403)
        .json({ message: "You can delete only your post." });
    }
  } catch (err) {
    return res.status(403).json({ message: "Token is not valid!" });
  }
};
