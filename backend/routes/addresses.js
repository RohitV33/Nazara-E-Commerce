const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");

router.get("/", authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { name, phone, flat, area, landmark = "", city, state, zip, country = "India", is_default = false } = req.body;
    if (!name || !phone || !flat || !area || !city || !state || !zip)
      return res.status(400).json({ message: "All required fields must be filled" });

    if (is_default)
      await db.query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [req.user.id]);

    const countResult = await db.query(`SELECT COUNT(*) as count FROM addresses WHERE user_id = $1`, [req.user.id]);
    const count = parseInt(countResult.rows[0].count);
    const setDefault = is_default || count === 0;

    const insertResult = await db.query(
      `INSERT INTO addresses (user_id, name, phone, flat, area, landmark, city, state, zip, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [req.user.id, name, phone, flat, area, landmark, city, state, zip, country, setDefault]
    );
    const newAddrResult = await db.query(`SELECT * FROM addresses WHERE id = $1`, [insertResult.rows[0].id]);
    res.status(201).json(newAddrResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add address" });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const { name, phone, flat, area, landmark = "", city, state, zip, country = "India", is_default = false } = req.body;
    if (is_default)
      await db.query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [req.user.id]);
    await db.query(
      `UPDATE addresses SET name=$1, phone=$2, flat=$3, area=$4, landmark=$5, city=$6, state=$7, zip=$8, country=$9, is_default=$10
       WHERE id = $11 AND user_id = $12`,
      [name, phone, flat, area, landmark, city, state, zip, country, is_default, req.params.id, req.user.id]
    );
    const updatedResult = await db.query(`SELECT * FROM addresses WHERE id = $1`, [req.params.id]);
    res.json(updatedResult.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to update address" });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    await db.query(`DELETE FROM addresses WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete address" });
  }
});

router.patch("/:id/default", authenticate, async (req, res) => {
  try {
    await db.query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [req.user.id]);
    await db.query(`UPDATE addresses SET is_default = true WHERE id = $1 AND user_id = $2`, [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to set default" });
  }
});

module.exports = router;