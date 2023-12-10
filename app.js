const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
// const nodemailer = require('nodemailer');
// const crypto = require('crypto'); 
// const { check, validationResult } = require("express-validator");
require("./models/connection");
const User = require("./models/userSchema");
const Feedback = require("./models/feedbackSchema");
const Volunteer = require("./models/volunteerSchema");
port =  8000;

const app = express();
app.use(session({
  secret: 'secret', 
  resave: true,
  saveUninitialized: true
}));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('views'));
app.use(express.static('public'));

// Function to hash the password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Route

app.get("/", (req, res) => {
  const successMessage = req.session.successfulSubmission ? 'Your volunteer registration was successful!' : '';
  
  // Clear the session flag
  req.session.successfulSubmission = false;
    res.sendFile('index.html', { root: 'views', successMessage });
})

app.get("/about", (req, res) => {
    res.sendFile('about.html', { root: 'views' });
})

app.get("/register", (req, res) => {
  if (req.session.user) {
    return res.redirect('/profile');
  }
  res.sendFile('register.html', { root: 'views' });
})
app.get("/volunteerform", (req, res) => {

  res.sendFile('volunteerForm.html', { root: 'views' });
})
app.get("/volunteer", (req, res) => {
  res.sendFile('volunteer.html', { root: 'views' });
})

app.post('/volunteerform', async (req, res) => {
  try {
    const { firstname, lastname, date, email, phone, initiative } = req.body;

    const newVolun = new Volunteer({
      firstname,
      lastname,
      date,
      email,
      phone,
      initiative,
    });

    const savedVolunteer = await newVolun.save();
    console.log('Volunteer data saved successfully:', savedVolunteer);

    // Find the user in the database by email
    const user = await User.findOne({ email });

    if (user) {
      // Update user's points in the database
      user.point += 10;
      await user.save();
      console.log('User points updated successfully:', user);
    }

    req.session.successfulSubmission = true;
    res.redirect("/?success=true");
  } catch (err) {
    console.error('Error saving volunteer data or updating user points:', err.message);
    res.status(500).send(`Error: ${err.message}`);
  }
});
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, cpassword, point } = req.body;

   
    if (password !== cpassword) {
      return res.status(400).send("Password and confirm password do not match");
    }

   
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).send("User with this email already exists. Please choose a different email or login.");
    }

    const hashedPassword = await hashPassword(password);

  
    const newUser = new User({
      name,
      email,
      point,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();
    console.log('User data saved successfully:', savedUser);

    res.redirect("/login");
  } catch (err) {
    console.error('Error saving user data:', err.message);
    res.status(500).send(`Error saving user data: ${err.message}`);
  }
}); 
app.post('/feedback', async (req, res) => {
  try {
      const { name, phone, feed, rate } = req.body;

      const newFeed = new Feedback({
          name,
          phone,
          feed,
          rate: rate || 5,
      });

      const savedFeedback = await newFeed.save();
      console.log('Feedback data saved successfully:', savedFeedback);
     
      // Respond with success or other relevant information
      res.status(200).redirect("/feedback?success=true");
  } catch (err) {
      console.error('Error: Feedback not submitted:', err.message);
      res.status(500).send(`Error: ${err.message}`);
  }
});
app.get('/feedback-details', async (req, res) => {
  try {
    const feedbackDetails = await Feedback.find();
    res.json(feedbackDetails);
  } catch (error) {
    console.error('Error fetching feedback details:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get("/login", (req, res) => {
  if (req.session.user) {

    return res.redirect('/profile');
  }
  res.sendFile('login.html', { root: 'views' });
});

app.post('/login', async (req, res) => {
  try {
    // Check if the user is already authenticated
    if (req.session.user) {
      return res.redirect('/profile');
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        
        await User.findByIdAndUpdate(user._id, { $set: { failedLoginAttempts: 0, lastFailedLogin: null } });

        req.session.user = {
          _id: user._id,
          name: user.name,
          point: user.point,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          // Add other user details as needed
        };
        res.redirect('/profile'); 
      } else {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        if (user.failedLoginAttempts >= 4 && user.lastFailedLogin && user.lastFailedLogin > fiveMinutesAgo) {
          
          await User.findByIdAndUpdate(user._id, {
            $inc: { failedLoginAttempts: 1 },
            $set: { lastFailedLogin: now },
          });

          if (user.failedLoginAttempts === 4) {
            await User.findByIdAndDelete(user._id);
            return res.status(401).send('Your account has been deleted due to multiple failed login attempts.');
          }

          res.status(401).send('Invalid email or password');
        } else {
          await User.findByIdAndUpdate(user._id, {
            $inc: { failedLoginAttempts: 1 },
            $set: { lastFailedLogin: now },
          });
          res.status(401).send('Invalid email or password');
        }
      }
    } else {
      res.status(401).send('Invalid email or password');
    }
  } catch (err) {
    console.error('Error during login:', err.message); 
    res.status(500).send(`Error during login: ${err.message}`);
  }
});

 
app.get("/feedback", (req, res) => {
    res.sendFile('feedback.html', { root: 'views' });
})

app.get("/faq", (req, res) => {
    res.sendFile('faq.html', { root: 'views' });
})
app.get("/profile", (req, res) => {
  const user = req.session.user;

  if (user) {
      res.sendFile('profile.html', { root: 'views' });
  } else {
      // Redirect to login if the user is not authenticated
      res.redirect('/login');
  }
})

app.get("/api/user-details", async (req, res) => {
  try {
    if (req.session.user) {
      const userId = req.session.user._id;
      const user = await User.findById(userId);

      if (user) {
        req.session.user = user;

        const { name, email, point, createdAt, updatedAt } = user;
        res.json({ name, email, point, createdAt, updatedAt });
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (err) {
    console.error('Error fetching user details:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.get("/logout", async (req, res) => {
  try {
      // Get the user details from the session
      const user = req.session.user;

      if (user) {
          // If needed, perform additional actions (e.g., delete user data from the database)

          // Clear the user data from the session
          req.session.destroy((err) => {
              if (err) {
                  console.error('Error destroying session:', err);
              } else {
                  // Redirect to the login page after successful log-out
                  res.redirect('/login');
              }
          });
      } else {
          // If the user is not authenticated, simply redirect to the login page
          res.redirect('/login');
      }
  } catch (err) {
      console.error('Error during log-out:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

//  Volunteer pages link

app.get("/Al%20Rafi'ah",(req, res)=>{
  res.sendFile("rafi.html", {root: 'views'});
})
app.get("/Al%20Olaya",(req, res)=>{
  res.sendFile("laya.html", {root: 'views'});
})
app.get("/Al%20Rabi",(req, res)=>{
  res.sendFile("rabi.html", {root: 'views'});
})
app.get("/Al%20Mohammadiyah",(req, res)=>{
  res.sendFile("mohammadiyah.html", {root: 'views'});
})
app.get("/Al%20Nakheel",(req, res)=>{
  res.sendFile("nakheel.html", {root: 'views'});
})
app.get("/Al%20Nuzha",(req, res)=>{
  res.sendFile("nuzha.html", {root: 'views'});
})
app.get("/Al%20Wadi",(req, res)=>{
  res.sendFile("wadi.html", {root: 'views'});
})
app.get("/redeem",(req, res)=>{
  res.sendFile("redeempoint.html", {root: 'views'});
})


app.listen(port, () => {
    console.log(`Server is running on port : http://localhost:${port}`);
})
