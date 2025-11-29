/********************************************************************************
* WEB322 – Assignment 03
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: Phoenix Ouyang      Student ID:135264240        Date: November 29, 2025
*
********************************************************************************/

require("dotenv").config();
const express = require("express");
const clientSessions = require("client-sessions");
const path = require("path");
const bcrypt = require('bcryptjs');
const PORT = 3000;

const app = express();

const { randomUUID } = require("crypto");
const { timeStamp } = require("console");

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.set('views', __dirname + '/views');

app.use(
  clientSessions({
    cookieName: "session",
    secret: process.env.SESSION_SECRET,
    duration: 30 * 60 * 1000, 
    activeDuration: 5 * 60 * 1000,
  })
);

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login'); // redirect if they are no logged in
  } else {
    next();
  }
}

// Homepage Route
app.get("/", (req, res) => {
    res.render("index");
});

// Login Route
app.get("/login", (req, res) => {
    res.render("login");
});

// Register Handler
app.get("/register", (req, res) => {
    res.render("register");
});

// Logout Handler
app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});


app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});