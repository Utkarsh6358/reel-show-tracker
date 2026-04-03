const express = require("express");
const router = express.Router();
const { findUser, createUser, updateUser } = require("../services/googleSheetService");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const existing = await findUser(username);
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }
    const user = await createUser(username, password);
    res.json({ message: "Account created", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const user = await findUser(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    res.json({ message: "Login successful", user: { userId: user.userId, username: user.username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/update-profile
router.post("/update-profile", async (req, res) => {
  const { userId, username, password } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    // Check username not taken by another user
    if (username) {
      const existing = await findUser(username);
      if (existing && existing.userId !== userId) {
        return res.status(409).json({ error: "Username already taken" });
      }
    }
    const updated = await updateUser(userId, { username, password });
    res.json({ message: "Profile updated", user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

module.exports = router;
