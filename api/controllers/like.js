import { db } from "../connect.js";
import jwt from "jsonwebtoken";

export const getLikes = async (req, res) => {
  const q = "SELECT userId FROM likes WHERE postId = ?";

  try {
    const [data] = await db.execute(q, [req.query.postId]);
    return res.status(200).json(data.map((like) => like.userId));
  } catch (err) {
    return res.status(500).json(err);
  }
};

export const addLike = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET);

    // Validate req.body.postId
    if (!req.body.postId) {
      return res.status(400).json("postId is required.");
    }

    const postId = req.body.postId;
    const userId = userInfo.id;

    // Check if the user has already liked the post
    const likeExistsQuery =
      "SELECT * FROM likes WHERE userId = ? AND postId = ?";
    const [existingLikes] = await db.execute(likeExistsQuery, [userId, postId]);

    if (existingLikes.length > 0) {
      return res.status(400).json("Post has already been liked by the user.");
    }

    // If the user hasn't liked the post insert in db
    const insertLikeQuery = "INSERT INTO likes (userId, postId) VALUES (?, ?)";
    const [result] = await db.execute(insertLikeQuery, [userId, postId]);

    if (result.affectedRows > 0) {
      return res.status(200).json("Post has been liked.");
    } else {
      return res.status(400).json("Failed to like the post.");
    }
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Token is not valid!");
    }
    return res.status(500).json(err);
  }
};

export const deleteLike = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET);

    const q = "DELETE FROM likes WHERE userId = ? AND postId = ?";
    const values = [userInfo.id, req.query.postId];

    const [result] = await db.execute(q, values);

    if (result.affectedRows > 0) {
      return res.status(200).json("Post has been disliked.");
    } else {
      return res.status(400).json("Failed to dislike the post.");
    }
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Token is not valid!");
    }
    return res.status(500).json(err);
  }
};
