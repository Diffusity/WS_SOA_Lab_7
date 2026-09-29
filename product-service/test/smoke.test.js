const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.PORT = "0";
process.env.CORS_ORIGIN = "*";

const { connectDB, disconnectDB } = require("../config/db");
const createApp = require("../app");

let mongod;

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

function request(server, method, path, body) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = http.request(
      { host: "127.0.0.1", port, method, path, headers: payload ? { "content-type": "application/json" } : {} },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode, headers: res.headers, json: data ? JSON.parse(data) : null })
        );
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri("studentdb_test"));
});

test.after(async () => {
  await disconnectDB();
  await mongod.stop();
});

test("GET /students returns empty array on fresh database", async () => {
  const server = await listen(createApp());
  const res = await request(server, "GET", "/students");
  assert.equal(res.status, 200);
  assert.deepEqual(res.json, []);
  server.close();
});

test("POST /students creates and persists a student", async () => {
  const server = await listen(createApp());
  const res = await request(server, "POST", "/students", {
    name: "Aarav Patel",
    email: "aarav@example.com",
    course: "Computer Science",
    semester: 5
  });
  assert.equal(res.status, 201);
  assert.equal(res.json.name, "Aarav Patel");
  assert.match(res.json.id, /^[0-9a-f]{24}$/);
  assert.equal(res.json._id, undefined);
  server.close();
});

test("POST /students rejects invalid body with 400 and details", async () => {
  const server = await listen(createApp());
  const res = await request(server, "POST", "/students", { name: "", email: "invalid-email", semester: -2 });
  assert.equal(res.status, 400);
  assert.equal(res.json.message, "Validation failed");
  assert.ok(Array.isArray(res.json.details) && res.json.details.length >= 3);
  server.close();
});

test("POST /students enforces the unique email index (duplicate -> 400)", async () => {
  const server = await listen(createApp());
  await request(server, "POST", "/students", {
    name: "First User",
    email: "dup@example.com",
    course: "Civil",
    semester: 1
  });
  const dup = await request(server, "POST", "/students", {
    name: "Second User",
    email: "dup@example.com",
    course: "Mechanical",
    semester: 2
  });
  assert.equal(dup.status, 400);
  assert.equal(dup.json.message, "Email 'dup@example.com' is already in use");
  server.close();
});

test("GET /students/:id returns 200 for existing and 404 for missing id", async () => {
  const server = await listen(createApp());
  const created = await request(server, "GET", "/students");
  const id = created.json[0].id;
  const found = await request(server, "GET", `/students/${id}`);
  assert.equal(found.status, 200);
  assert.equal(found.json.id, id);
  const missing = await request(server, "GET", `/students/${"0".repeat(24)}`);
  assert.equal(missing.status, 404);
  assert.match(missing.json.message, /does not exist/);
  server.close();
});

test("GET /students/:id returns 400 for malformed id", async () => {
  const server = await listen(createApp());
  const res = await request(server, "GET", "/students/not-an-id");
  assert.equal(res.status, 400);
  server.close();
});

test("PUT /students/:id partially updates and returns the updated student", async () => {
  const server = await listen(createApp());
  const list = await request(server, "GET", "/students");
  const id = list.json[0].id;
  const updated = await request(server, "PUT", `/students/${id}`, { course: "Data Science", semester: 6 });
  assert.equal(updated.status, 200);
  assert.equal(updated.json.course, "Data Science");
  assert.equal(updated.json.semester, 6);
  assert.equal(updated.json.name, "Aarav Patel");
  server.close();
});

test("PUT /students/:id returns 404 for non-existent id", async () => {
  const server = await listen(createApp());
  const res = await request(server, "PUT", `/students/${"1".repeat(24)}`, { course: "X" });
  assert.equal(res.status, 404);
  server.close();
});

test("DELETE /students/:id returns 204 then 404 when repeated", async () => {
  const server = await listen(createApp());
  const created = await request(server, "POST", "/students", {
    name: "Temp Student",
    email: "temp@example.com",
    course: "Physics",
    semester: 2
  });
  const id = created.json.id;
  const deleted = await request(server, "DELETE", `/students/${id}`);
  assert.equal(deleted.status, 204);
  const again = await request(server, "DELETE", `/students/${id}`);
  assert.equal(again.status, 404);
  server.close();
});

test("PERSISTENCE: data survives a full server restart against the same database", async () => {
  const firstServer = await listen(createApp());
  const created = await request(firstServer, "POST", "/students", {
    name: "Persistence Probe",
    email: "persist@example.com",
    course: "Robotics",
    semester: 7
  });
  assert.equal(created.status, 201);
  firstServer.close();

  const secondServer = await listen(createApp());
  const afterRestart = await request(secondServer, "GET", "/students");
  assert.equal(afterRestart.status, 200);
  const probe = afterRestart.json.find((s) => s.email === "persist@example.com");
  assert.ok(probe, "student created before restart must still exist after restart");
  assert.equal(probe.name, "Persistence Probe");
  secondServer.close();
});

test("CORS: responses carry Access-Control-Allow-Origin header", async () => {
  process.env.CORS_ORIGIN = "http://localhost:5173";
  const server = await listen(createApp());
  const res = await request(server, "GET", "/students");
  assert.equal(res.headers["access-control-allow-origin"], "http://localhost:5173");
  server.close();
  delete process.env.CORS_ORIGIN;
});
