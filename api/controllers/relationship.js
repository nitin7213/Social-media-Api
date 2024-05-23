import { db } from "../connect.js";
import jwt from "jsonwebtoken";

export const getRelationships = async (req, res) => {
  try {
    const { followedUserId } = req.query;
    const q =
      "SELECT followerUserId FROM relationships WHERE followedUserId = ?";
    const [data] = await db.execute(q, [followedUserId]);
    return res
      .status(200)
      .json(data.map((relationship) => relationship.followerUserId));
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const addRelationship = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ error: "Not logged in" });

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    // Check if the relationship already exists
    const existingRelationshipQuery =
      "SELECT * FROM relationships WHERE followerUserId = ? AND followedUserId = ?";
    const [existingRelationship] = await db.execute(existingRelationshipQuery, [
      userInfo.id,
      userId,
    ]);

    if (existingRelationship.length > 0) {
      return res.status(200).json({ message: "Already Followed" });
    }

    const q =
      "INSERT INTO relationships (followerUserId, followedUserId) VALUES (?, ?)";
    const [data] = await db.execute(q, [userInfo.id, userId]);
    return res.status(200).json({ message: "Successfully followed" });
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteRelationship = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json({ error: "Not logged in" });

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    // Check if the relationship exists
    const existingRelationshipQuery =
      "SELECT * FROM relationships WHERE followerUserId = ? AND followedUserId = ?";
    const [existingRelationship] = await db.execute(existingRelationshipQuery, [
      userInfo.id,
      userId,
    ]);

    if (existingRelationship.length === 0) {
      return res.status(200).json({ message: "Already unfollowed" });
    }

    const q =
      "DELETE FROM relationships WHERE followerUserId = ? AND followedUserId = ?";
    await db.execute(q, [userInfo.id, userId]);
    return res.status(200).json({ message: "Successfully unfollowed" });
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
