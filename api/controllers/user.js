import { db } from "../connect.js";
import jwt from "jsonwebtoken";

export const getUser = async (req, res) => {
  const userId = req.params.userId;
  const q = "SELECT * FROM users WHERE id=?";

  try {
    const [data] = await db.execute(q, [userId]);
    if (data.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password, ...info } = data[0];
    return res.json(info);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateUser = async (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json("Not authenticated!");

  try {
    const userInfo = jwt.verify(token, process.env.JWT_SECRET);

    const q = `
      UPDATE users 
      SET name = ?, city = ?, website = ?, profilePic = ?, coverPic = ? 
      WHERE id = ?
    `;

    const values = [
      req.body.name,
      req.body.city,
      req.body.website,
      req.body.profilePic,
      req.body.coverPic,
      userInfo.id,
    ];

    const [result] = await db.execute(q, values);

    if (result.affectedRows > 0) {
      const fetchQuery = "SELECT * FROM users WHERE id = ?";
      const [userData] = await db.execute(fetchQuery, [userInfo.id]);

      return res.json({
        message: "Profile updated successfully",
        affectedRows: result.affectedRows,
        userData: userData,
      });
    } else {
      return res.status(403).json("You can update only your own profile!");
    }
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(403).json("Token is not valid!");
    }
    return res.status(500).json(err);
  }
};
