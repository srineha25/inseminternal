import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database: fsadexam.db
  const db = new Database("fsadexam.db");

  // Create CustomerAccount table (Entity)
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `);

  app.use(express.json());

  // I. Insert a new record into the database
  app.post("/api/customers", (req, res) => {
    const { name, description, date, status } = req.body;
    if (!name || !date || !status) {
      return res.status(400).json({ error: "Name, Date, and Status are required." });
    }

    try {
      const stmt = db.prepare(
        "INSERT INTO customer_accounts (name, description, date, status) VALUES (?, ?, ?, ?)"
      );
      const info = stmt.run(name, description, date, status);
      res.status(201).json({ id: info.lastInsertRowid, name, description, date, status });
    } catch (error) {
      res.status(500).json({ error: "Failed to insert record." });
    }
  });

  // II. Update fields such as Name or Status based on the ID
  app.patch("/api/customers/:id", (req, res) => {
    const { id } = req.params;
    const { name, status } = req.body;

    if (!name && !status) {
      return res.status(400).json({ error: "At least one field (Name or Status) must be provided for update." });
    }

    try {
      let query = "UPDATE customer_accounts SET ";
      const params = [];
      if (name) {
        query += "name = ?, ";
        params.push(name);
      }
      if (status) {
        query += "status = ?, ";
        params.push(status);
      }
      query = query.slice(0, -2); // Remove trailing comma
      query += " WHERE id = ?";
      params.push(id);

      const stmt = db.prepare(query);
      const info = stmt.run(...params);

      if (info.changes === 0) {
        return res.status(404).json({ error: "Customer account not found." });
      }

      res.json({ message: "Record updated successfully." });
    } catch (error) {
      res.status(500).json({ error: "Failed to update record." });
    }
  });

  // Fetch all records
  app.get("/api/customers", (req, res) => {
    try {
      const stmt = db.prepare("SELECT * FROM customer_accounts ORDER BY id DESC");
      const rows = stmt.all();
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch records." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
