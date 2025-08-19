const express = require("express");
// (optional) only if you call from http://localhost:4200 without a proxy
const cors = require("cors");
const http = require("http");
const app = express();
app.use(express.json());
app.use(cors());

// very simple User "class"
class User {
  constructor(username, birthdate, age, email, password, valid) {
    this.username = username;
    this.birthdate = birthdate;
    this.age = age;
    this.email = email;
    this.password = password;
    this.valid = valid;
  }
}

// hard-coded users (this is our fake database)
var users = [
  new User("Bella", "2001-05-20", 24, "b@gmail.com", "123", true),
  new User("Alex", "2000-11-02", 24, "alex@gmail.com", "123", true),
  new User("Malees", "1998-08-15", 27, "malees@gmail.com", "123", true),
];

// POST /api/auth  check login
app.post("/api/auth", function (req, res) {
  console.log("POST /api/auth", req.body);
  var email = req.body && req.body.email ? req.body.email : "";
  var password = req.body && req.body.password ? req.body.password : "";

  if (!email || !password) {
    return res
      .status(400)
      .json({ ok: false, message: "Email and password required" });
  }

  // simple loop to find a match
  var foundUser = null;
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
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

  // don’t send the password back
  var safeUser = {
    username: foundUser.username,
    birthdate: foundUser.birthdate,
    age: foundUser.age,
    email: foundUser.email,
    // password: foundUser.password,
    valid: foundUser.valid,
  };

  res.json({ ok: true, user: safeUser });
});

// start the server
var PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log("API running at http://localhost:" + PORT);
});
