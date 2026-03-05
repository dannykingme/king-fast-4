import express, { Request, Response } from "express";
import Database from "better-sqlite3";

const app = express();
app.use(express.json());

const db = new Database("./users.db");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
  )
`);

interface User {
  id: number;
  name: string;
  email: string;
}

app.get("/users", (_req: Request, res: Response) => {
  const users = db.prepare("SELECT id, name, email FROM users").all() as User[];
  res.json(users);
});

app.post("/users", (req: Request, res: Response) => {
  const body = req.body;
  const errors: Array<{
    type: string;
    loc: string[];
    msg: string;
    input: unknown;
    url: string;
  }> = [];

  if (body.name === undefined || body.name === null) {
    errors.push({
      type: "missing",
      loc: ["body", "name"],
      msg: "Field required",
      input: body,
      url: "https://errors.pydantic.dev/2.5/v/missing",
    });
  }

  if (body.email === undefined || body.email === null) {
    errors.push({
      type: "missing",
      loc: ["body", "email"],
      msg: "Field required",
      input: body,
      url: "https://errors.pydantic.dev/2.5/v/missing",
    });
  }

  if (errors.length > 0) {
    res.status(422).json({ detail: errors });
    return;
  }

  const { name, email } = body;

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    res.status(400).json({ detail: "Email already registered" });
    return;
  }

  const stmt = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
  const result = stmt.run(name, email);

  const user: User = {
    id: Number(result.lastInsertRowid),
    name,
    email,
  };

  res.status(201).json(user);
});

export { app, db };

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
