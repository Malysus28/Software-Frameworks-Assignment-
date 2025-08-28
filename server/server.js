const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ["http://localhost:4200", "http://127.0.0.1:4200", "*"] },
});

// cors and express
app.use(cors());
app.use(express.json());

// user roles to manage AC
const Roles = {
  SUPER_ADMIN: "super-admin",
  GROUP_ADMIN: "group-admin",
  USER: "user",
};

// class for user
class User {
  constructor({
    id,
    username,
    birthdate,
    age,
    email,
    password,
    valid,
    roles,
    groups,
  }) {
    this.id = id;
    this.username = username;
    this.birthdate = birthdate;
    this.age = age;
    this.email = email;
    this.password = password;
    this.valid = valid;
    this.roles = roles || [Roles.USER];
    this.groups = groups || [];
  }
}

// hardcoded users
let users = [
  new User({
    id: "u-100",
    username: "Bella",
    birthdate: "2001-05-20",
    age: 10,
    email: "b@gmail.com",
    password: "123",
    valid: true,
    roles: [Roles.SUPER_ADMIN],
    groups: ["g1"],
  }),
  new User({
    id: "u-101",
    username: "Alex",
    birthdate: "2000-11-02",
    age: 5,
    email: "alex@gmail.com",
    password: "123",
    valid: true,
    roles: [Roles.GROUP_ADMIN],
    groups: ["g1"],
  }),
  new User({
    id: "u-102",
    username: "Malees",
    birthdate: "1998-08-15",
    age: 3,
    email: "malees@gmail.com",
    password: "123",
    valid: true,
    roles: [Roles.USER],
    groups: [],
  }),
];

function toSafeUser(u) {
  return {
    id: u.id,
    username: u.username,
    birthdate: u.birthdate,
    age: u.age,
    email: u.email,
    valid: u.valid,
    roles: u.roles,
    groups: u.groups,
  };
}

// group
const groups = [
  {
    id: "g1",
    name: "Design Team",
    createdBy: "u-101", // Alex
    adminIds: ["u-101"],
    memberIds: ["u-100", "u-101"], // Bella, Alex
  },
];
// channels
const channels = [
  { id: "c1", groupId: "g1", name: "Web App Dev 3004ICT" },
  { id: "c2", groupId: "g1", name: "Software Frameworks 3813ICT" },
  { id: "c3", groupId: "g1", name: "Work Integrated Learning 3821ICT" },
  { id: "c4", groupId: "g1", name: "The Ethical Technologist 3410ICT" },
  { id: "c5", groupId: "g1", name: "Interaction Design 3723ICT" },
  { id: "c6", groupId: "g1", name: "Creative Coding 1701ICT" },
];

const ALIAS = { u1: "u-100", u2: "u-101", u3: "u-102" };
const canonUserId = (id) => ALIAS[id] || id;

// POST /api/auth  { email, password }
app.post("/api/auth", (req, res) => {
  const email = req.body?.email || "";
  const password = req.body?.password || "";

  if (!email || !password) {
    return res
      .status(400)
      .json({ ok: false, message: "Email and password required" });
  }

  const foundUser = users.find(
    (u) =>
      u.email.toLowerCase() === String(email).toLowerCase() &&
      u.password === String(password)
  );

  if (!foundUser) {
    return res.status(401).json({ ok: false, message: "Invalid credentials" });
  }

  const token = Buffer.from(foundUser.email, "utf8").toString("base64");

  return res.json({
    ok: true,
    user: toSafeUser(foundUser),
    token,
  });
});

// Optional compatibility route
app.post("/api/auth/login", (req, res) => {
  const { username, email, password } = req.body || {};
  let u = null;

  if (username) {
    u = users.find(
      (x) => String(x.username).toLowerCase() === String(username).toLowerCase()
    );
  }
  if (!u && email) {
    u = users.find(
      (x) => String(x.email).toLowerCase() === String(email).toLowerCase()
    );
  }
  if (!u) return res.status(401).json({ error: "Invalid user" });
  if (
    typeof password !== "undefined" &&
    String(password) !== String(u.password)
  ) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  return res.json({ user: toSafeUser(u) });
});

// Groups (optional filter by user)
app.get("/api/groups", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json(groups);
  const uid = canonUserId(String(userId));
  const gs = groups.filter(
    (g) => g.memberIds.includes(uid) || g.adminIds.includes(uid)
  );
  res.json(gs);
});

// Channels in a group
app.get("/api/groups/:gid/channels", (req, res) => {
  const { gid } = req.params;
  res.json(channels.filter((c) => c.groupId === gid));
});

// sockets
io.on("connection", (socket) => {
  console.log("client connected:", socket.id);

  socket.on("join", ({ userId, groupId, channelId }) => {
    const uid = canonUserId(String(userId));
    const user = users.find((u) => u.id === uid);
    const group = groups.find((g) => g.id === groupId);
    const channel = channels.find(
      (c) => c.id === channelId && c.groupId === groupId
    );

    console.log("join payload:", {
      userId,
      canonical: uid,
      groupId,
      channelId,
      userFound: !!user,
      groupFound: !!group,
      channelFound: !!channel,
    });

    if (!user || !group || !channel) return;

    const isMember =
      group.memberIds.includes(uid) || group.adminIds.includes(uid);
    if (!isMember) return;

    const room = `${groupId}:${channelId}`;
    socket.join(room);
    socket.data.room = room;
    socket.data.user = { id: user.id, username: user.username };

    io.to(room).emit("system", {
      text: `${user.username} joined ${channel.name}`,
    });
  });

  socket.on("leave", () => {
    if (socket.data?.room) {
      socket.leave(socket.data.room);
      socket.data.room = null;
    }
  });

  socket.on("message", ({ text }) => {
    const room = socket.data.room;
    const user = socket.data.user;
    if (!room || !user || !text?.trim()) return;
    io.to(room).emit("message", { user, text: text.trim(), ts: Date.now() });
  });

  socket.on("disconnect", () => {
    const room = socket.data?.room;
    const user = socket.data?.user;
    if (room && user)
      io.to(room).emit("system", { text: `${user.username} left` });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
