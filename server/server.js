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

// class for user----------------------------------------------
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

// hardcoded users section --------------------------------------
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
    groups: ["g2"],
  }),
];

// group section ----------------------------------------------
const groups = [
  {
    id: "g1",
    name: "staff",
    createdBy: "u-101", // Alex
    adminIds: ["u-101"],
    memberIds: ["u-100", "u-101"], // Bella, Alex
  },
  {
    id: "g2",
    name: "students",
    createdBy: "u-101", // Alex
    adminIds: ["u-101"],
    memberIds: ["u-103"], //Malees
  },
];
// channels section -------------------------------------------
const channels = [
  { id: "c1", groupId: "g1", name: "Web App Dev 3004ICT" },
  { id: "c2", groupId: "g1", name: "Software Frameworks 3813ICT" },
  { id: "c3", groupId: "g1", name: "Work Integrated Learning 3821ICT" },
  { id: "c4", groupId: "g1", name: "The Ethical Technologist 3410ICT" },
  { id: "c5", groupId: "g1", name: "Interaction Design 3723ICT" },
  { id: "c6", groupId: "g1", name: "Creative Coding 1701ICT" },
  // { id: "c7", groupId: "g2", name: "Only Students" }, //no card for this yet experiment with this later
];

// HELPERS section -------------------------------------------
const ALIAS = { u1: "u-100", u2: "u-101", u3: "u-102" };
const canonUserId = (id) => ALIAS[id] || id;
const isSuperAdmin = (u) => u?.roles?.includes(Roles.SUPER_ADMIN);
const isGroupAdmin = (u) => u?.roles?.includes(Roles.GROUP_ADMIN);

// this function converts a user object to a safe user object
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

function getActor(req) {
  const q = req.query?.actorId || req.headers["x-actor-id"];
  const id = q ? String(q) : null;
  const uid = id ? canonUserId(id) : null;
  return users.find((u) => u.id === uid) || null;
}
// this is a simple function to just increment group number like g1-g2
function nextId(prefix, arr) {
  const nums = arr
    .map((x) => Number(String(x.id).replace(`${prefix}`, "")))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}${max + 1}`;
}
// AUTH ENDPOINTS section -------------------------------------------

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

// investinate this, username or email.
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

// group channels----------------------------------
app.get("/api/groups", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.json(groups);
  const uid = canonUserId(String(userId));
  const gs = groups.filter(
    (g) => g.memberIds.includes(uid) || g.adminIds.includes(uid)
  );
  res.json(gs);
});

// listing the channels in the group i need to investigate this!
app.get("/api/groups/:gid/channels", (req, res) => {
  const { gid } = req.params;
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: "userId is required" });
  const uid = canonUserId(String(userId));

  const group = groups.find((g) => g.id === gid);
  if (!group) return res.status(404).json({ error: "Group not found" });

  const isMember =
    group.memberIds.includes(uid) || group.adminIds.includes(uid);
  if (!isMember)
    return res.status(403).json({ error: "Not a member of this group" });

  return res.json(channels.filter((c) => c.groupId === gid));
});
// super admin stuff section -------------------------------------------

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

app.post("/api/users/:id/promote", (req, res) => {
  const actor = getActor(req);
  if (!actor || !isSuperAdmin(actor)) {
    return res.status(403).json({ error: "Forbidden: super admin only" });
  }

  const targetId = canonUserId(String(req.params.id));
  const role = String(req.body?.role || "").toLowerCase();
  const target = users.find((u) => u.id === targetId);
  if (!target) return res.status(404).json({ error: "User not found" });

  if (role === "group-admin") {
    if (!target.roles.includes(Roles.GROUP_ADMIN))
      target.roles.push(Roles.GROUP_ADMIN);
    return res.json({ ok: true, user: toSafeUser(target) });
  }

  if (role === "super-admin") {
    if (!target.roles.includes(Roles.SUPER_ADMIN))
      target.roles.push(Roles.SUPER_ADMIN);
    return res.json({ ok: true, user: toSafeUser(target) });
  }

  return res.status(400).json({ error: "Invalid role" });
});

// list users (both super-admin and group-admin can view)
app.get("/api/users", (req, res) => {
  const actor = getActor(req);
  if (!actor || (!isSuperAdmin(actor) && !isGroupAdmin(actor))) {
    return res.status(403).json({ error: "Forbidden" });
  }
  return res.json(users.map(toSafeUser));
});

// ONLY super-admin can delete *users* (global removal)
app.delete("/api/users/:id", (req, res) => {
  const actor = getActor(req);
  if (!actor || !isSuperAdmin(actor)) {
    return res.status(403).json({ error: "Forbidden: super admin only" });
  }

  const targetId = canonUserId(String(req.params.id));
  const idx = users.findIndex((u) => u.id === targetId);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  const [removed] = users.splice(idx, 1);

  // basic cleanup: remove from groups’ adminIds/memberIds
  for (const g of groups) {
    g.memberIds = g.memberIds.filter((id) => id !== targetId);
    g.adminIds = g.adminIds.filter((id) => id !== targetId);
  }

  return res.json({ ok: true, removed: toSafeUser(removed) });
});

// group admin management section +endpoints
//create + delete groups (creator-only delete; super-admin override).

app.post("/api/groups", (req, res) => {
  const actor = getActor(req);
  if (!actor || !isGroupAdmin(actor)) {
    return res.status(403).json({ error: "Forbidden: group admin only" });
  }

  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Group name required" });

  const newGroup = {
    id: nextId("g", groups),
    name,
    createdBy: actor.id,
    adminIds: [actor.id],
    memberIds: [actor.id],
  };
  groups.push(newGroup);

  // (Optional) reflect in creator's groups; safe to omit if you prefer
  if (!actor.groups.includes(newGroup.id)) actor.groups.push(newGroup.id);

  return res.json({ ok: true, group: newGroup });
});

app.delete("/api/groups/:gid", (req, res) => {
  const actor = getActor(req);
  if (!actor || !isGroupAdmin(actor)) {
    return res.status(403).json({ error: "Forbidden: group admin only" });
  }

  const gid = String(req.params.gid);
  const g = groups.find((x) => x.id === gid);
  if (!g) return res.status(404).json({ error: "Group not found" });

  // Only the creator can delete; super-admins may override
  if (g.createdBy !== actor.id && !isSuperAdmin(actor)) {
    return res.status(403).json({
      error: "Only the creator (or a super admin) can delete this group",
    });
  }

  // Remove channels in this group
  for (let i = channels.length - 1; i >= 0; i--) {
    if (channels[i].groupId === gid) channels.splice(i, 1);
  }

  // Remove the group
  const idx = groups.findIndex((x) => x.id === gid);
  groups.splice(idx, 1);

  // (Optional) remove group id from each user's groups array
  for (const u of users) {
    u.groups = (u.groups || []).filter((id) => id !== gid);
  }

  return res.json({ ok: true });
});

// sockets section for chatrooms-------------------------------

io.on("connection", (socket) => {
  console.log("client connected:", socket.id);

  socket.on("join", ({ userId, groupId, channelId }) => {
    if (socket.data?.room) {
      socket.leave(socket.data.room);
      socket.data.room = null;
    }

    const uid = canonUserId(String(userId));
    const user = users.find((u) => u.id === uid);
    const group = groups.find((g) => g.id === groupId);
    const channel = channels.find(
      (c) => c.id === channelId && c.groupId === groupId
    );

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
// start server ----------------------------------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
