const request = require("supertest");
const app = require("../app");

/**
 * These are lightweight smoke tests that run without a real DB.
 * They verify that the routing layer returns sensible HTTP codes.
 * Full integration tests require a test MongoDB instance.
 */
describe("Auth API – phone (password) flow", () => {
  it("rejects email on POST /api/auth/register with 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", identifier: "test@example.com", password: "password123", role: "requester" });
    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/OTP/i);
  });

  it("rejects email on POST /api/auth/login with 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ identifier: "test@example.com", password: "password123" });
    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toMatch(/OTP/i);
  });

  it("returns 400 for missing fields on register", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("returns 400 for missing fields on login", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});

describe("Auth API – OTP (email) send endpoint", () => {
  it("rejects phone number on POST /api/auth/otp/send with 400", async () => {
    const res = await request(app)
      .post("/api/auth/otp/send")
      .send({ identifier: "+91 9999999999" });
    expect(res.statusCode).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it("returns 404 for unknown email on POST /api/auth/otp/send", async () => {
    const res = await request(app)
      .post("/api/auth/otp/send")
      .send({ identifier: "unknown@example.com" });
    // Will be 404 if DB is connected (user not found), or 500 if not
    expect([404, 500]).toContain(res.statusCode);
  });
});
