import { db } from "../connect.js";
import jwt from "jsonwebtoken";
import moment from "moment";

export const getComments = async (req, res) => {
  const q = `
    SELECT c.*, u.id AS userId, name, profilePic 
    FROM comments AS c 
    JOIN users AS u ON u.id = c.userId
    WHERE c.postId = ? 
    ORDER BY c.createdAt DESC
  `;

  try {
    const [data] = await db.execute(q, [req.query.postId]);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json(err);
  }
};

export const addComment = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not logged in!");

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET);

    const q = `
      INSERT INTO comments (\`desc\`, createdAt, userId, postId) 
      VALUES (?, ?, ?, ?)
    `;
    const values = [
      req.body.desc,
      moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
      userInfo.id,
      req.body.postId,
    ];

    const [result] = await db.execute(q, values);

    if (result.affectedRows > 0) {
      return res.status(200).json("Comment has been created.");
    } else {
      return res.status(400).json("Failed to create comment.");
    }
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Token is not valid!");
    }
    return res.status(500).json(err);
  }
};

export const deleteComment = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET);

    const commentId = req.params.id;
    const q = "DELETE FROM comments WHERE id = ? AND userId = ?";

    const [result] = await db.execute(q, [commentId, userInfo.id]);

    if (result.affectedRows > 0) {
      return res.json("Comment has been deleted!");
    } else {
      return res.status(403).json("You can delete only your comment!");
    }
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Token is not valid!");
    }
    return res.status(500).json(err);
  }
};
