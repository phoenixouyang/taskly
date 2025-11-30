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
const mongoose = require("mongoose");
const Sequelize = require("sequelize");
const PORT = process.env.PORT || 3000;

const app = express();

// view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// client session middleware
app.use(
  clientSessions({
    cookieName: "session",
    secret: process.env.SESSION_SECRET,
    duration: 30 * 60 * 1000, 
    activeDuration: 5 * 60 * 1000,
  })
);

// mongose setup
mongoose.connect(process.env.mongoose);

let Schema = mongoose.Schema;

// Define user schema
let userSchema = new Schema({
  username: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    unique: true
  },
  password: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

let User = mongoose.model("users", userSchema);

// Sequelize setup
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.log('Unable to connect to the database:', err);
  });

  // define task model
  const Task = sequelize.define("Task", {
    title: { 
      type: Sequelize.STRING,
      allowNull: false
    },
    description: Sequelize.TEXT,
    dueDate: Sequelize.DATE,
    status: {
      type: Sequelize.STRING,
      defaultValue: "pending"
    },
    userId: {
      type: Sequelize.STRING,
      allowNull: false
    }
  });

// set local variables
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Authentication middleware
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
};

// homepage route handler
app.get("/", (req, res) => {
    res.render("index");
});

// login route handler
app.get("/login", (req, res) => {
    res.render("login", { error: null });
});

// login POST handler
app.post("/login", (req, res) => {

  User.findOne({ username: req.body.username })
    .exec()
    .then((user) => {
      if (!user) {
        res.render("login", { error: "Incorrect username or password" });
        return;
      } else {
        if (!bcrypt.compareSync(req.body.password, user.password)) {
          res.render("login", { error: "Incorrect username or password" });
          return;
        }
  
        req.session.user = {
          username: user.username,
          email: user.email
        };
        res.redirect("/dashboard");
      }
    })
    .catch((err) => {
      console.log(`Error: ${err}`);
      res.render("login", {error: "An error occured - please try again later." });
    });
});

// register route handler
app.get("/register", (req, res) => {
    res.render("register", { error: null });
});

// register POST handler
app.post("/register", (req, res) => {

  if (!req.body.username.trim() || !req.body.email.trim()) {
    res.render("register", { error: "Username and email cannot be empty" });
    return;
  }

  User.findOne({ $or: [{ username: req.body.username }, { email: req.body.email }] })
    .exec()
    .then((user) => {
      if (user) {
        res.render("register", { error: "Username or email is already taken" });
        return;
      }
      else {
        const newUser = new User({
          username: req.body.username,
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, 10)
        });
  
        newUser.save().then(() => {
          req.session.user = {
            username: req.body.username,
            email: req.body.email
          };
          res.redirect("/dashboard");
        })
        .catch((err) => {
          console.log(`Error: ${err}`);
          res.render("register", {error: "An error occured - please try again later." });    
        });
      }
    })
    .catch((err) => {
      console.log(`Error: ${err}`);
      res.render("register", {error: "An error occured - please try again later." });    
    });
});

// dashboard route handler
app.get("/dashboard", ensureLogin, (req, res) => {
  res.render("dashboard");
});

// logout route handler
app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

// task route handler
app.get("/tasks", ensureLogin, (req, res) => {
  Task.findAll({
    where: {
      userId: req.session.user.username
    },
  }).then((data) => {
    res.render("tasks", { tasks: data.length > 0 ? data : null, error: null});
  })
  .catch((err) => {
    res.render("tasks", { tasks: null, error: "There was an error while loading tasks"});
  });
});

// task/add route handler
app.get("/tasks/add", ensureLogin, (req, res) => {
  res.render("addTask", {error: null});
});

// task/add POST handler
app.post("/tasks/add", ensureLogin, (req, res) => {
  if (!req.body.title.trim()) {
    res.render("addTask", { error: "Task title cannot be empty" });
    return;
  }
  Task.create({
    title: req.body.title,
    description: req.body.description,
    dueDate: req.body.dueDate,
    userId: req.session.user.username
  }).then(() => {
    res.redirect("/tasks");
  }).catch((err) => {
    res.render("addTask", { error: "There was an error adding tasks" });
  })

});

// catch request for routes that don't exist
app.use((req, res, next) => {
  if (req.session.user) {
    res.redirect("/dashboard");
  } else {
    res.redirect("/");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});