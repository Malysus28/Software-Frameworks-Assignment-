const express = require("express");
const cors = require("cors");
const http = require("http");
const app = express();
app.use(express.json());
app.use(cors());

// user roles
const Roles = {
  SUPER_ADMIN: "super-admin",
  GROUP_ADMIN: "group-admin",
  USER: "user",
};

// User class defined
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

// hard-coded users ( fake database)
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
    groups: [1, 2, 3],
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
    groups: [100],
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
    groups: [100],
  }),
];
//strip password before sending to client
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

// define the POST endpoint at api/auth
app.post("/api/auth", (req, res) => {
  const email = req.body?.email || "";
  const password = req.body?.password || "";

  if (!email || !password) {
    return res
      .status(400)
      .json({ ok: false, message: "Email and password required" });
  }

  // case-insensitive email, exact password match
  let foundUser = null;
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    if (
      u.email.toLowerCase() === String(email).toLowerCase() &&
      u.password === String(password)
    ) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser) {
    return res.status(401).json({ ok: false, message: "Invalid credentials" });
  }

  // minimal "token" (email encoded)
  const token = Buffer.from(foundUser.email, "utf8").toString("base64");

  return res.json({
    ok: true,
    user: toSafeUser(foundUser),
    token,
  });
});

//start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("API running at http://localhost:" + PORT);
});
