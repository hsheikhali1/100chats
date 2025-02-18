const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();
const port = process.env.PORT || 4000;
const Users = require("./models/user");
const { logger } = require("./helpers/helpers");
const bodyParser = require("body-parser");
const path = require("path");
const { readFromDb, writeToDb, deleteFromDb } = require("./helpers/dbhelpers");

const users = require("./routes/userRoutes");
const swipe = require("./routes/swipeRoutes");
const login = require("./routes/loginRoutes");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
//both index.js and things.js should be in same directory
app.use("/users", users);
app.use("/swipe", swipe);
app.use("/login", login);

app.use(logger);
app.set("json spaces", 2);
app.listen(port, () => console.log(`listening on port: ${port}`));
app.set("view engine", "ejs");
// app.use(express.static("public"));

const { auth } = require("express-openid-connect");

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: "a long, randomly-generated string stored in env",
  baseURL: "http://localhost:4000",
  clientID: "U2ee5rGnHGlXxHIP1srNgzarbCHuNihJ",
  issuerBaseURL: "https://dev-hd797ril.us.auth0.com",
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// req.isAuthenticated is provided from the auth router
app.get("/", (req, res) => {
  res.send(
    req.oidc.isAuthenticated()
      ? `Logged in ${JSON.stringify(req.oidc.user)}`
      : "Logged out"
  );
});

// mongoose setup
mongoose.connect(process.env.DBSTRING);
const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("Connected to db"));

app.get("/", async (req, res) => {
  try {
    // res.status(200).send('Getting "/"  route');
    res.render("../server/views/index.ejs");
  } catch (err) {
    console.log(err);
  }
});
