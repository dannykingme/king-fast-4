import request from "supertest";
import { app, db } from "./main";

beforeEach(() => {
  db.exec("DELETE FROM users");
  db.exec("DELETE FROM sqlite_sequence WHERE name='users'");
});

afterAll(() => {
  db.close();
});

describe("POST /users", () => {
  it("should create a user and return 201", async () => {
    const response = await request(app)
      .post("/users")
      .send({ name: "John Doe", email: "john@example.com" });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("John Doe");
    expect(response.body.email).toBe("john@example.com");
    expect(response.body).toHaveProperty("id");
  });

  it("should return 400 for duplicate email", async () => {
    await request(app)
      .post("/users")
      .send({ name: "John Doe", email: "john@example.com" });

    const response = await request(app)
      .post("/users")
      .send({ name: "Jane Doe", email: "john@example.com" });

    expect(response.status).toBe(400);
    expect(response.body.detail).toBe("Email already registered");
  });
});

describe("GET /users", () => {
  it("should return all users", async () => {
    await request(app)
      .post("/users")
      .send({ name: "John Doe", email: "john@example.com" });

    const response = await request(app).get("/users");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].name).toBe("John Doe");
    expect(response.body[0].email).toBe("john@example.com");
  });
});
