import express from 'express';
import cors from 'cors';  
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import Session from 'express-session';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import jwt from 'jsonwebtoken';
import util from 'util';
import bcrypt from 'bcryptjs'; // Use bcryptjs for better compatibility
import process from 'process';
import { addLowDBData, clearLowDBData } from './db/db.js'; // Import database functions
import { User, updateLastLogin, clearSqliteData } from './db/user.js'; // Import User model and updateLastLogin function

const app = express();
const port = process.env.EXPRESS_PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET;
const jwtVerify = util.promisify(jwt.verify);


// Use Helmet to secure the app by setting various HTTP headers
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET, { sameSite: 'lax' })); // To parse cookies from request headers
app.use(Session({
    secret: process.env.CSRF_SECRET, // Use a strong, random secret
    resave: false,
    saveUninitialized: true
}));
// Only apply CSRF protection to non-GET requests
app.use((req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  return csurf({
    cookie:{
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Use HTTPS in production
        sameSite: "Lax", // Adjust based on cross-domain requirements
    },
  })(req, res, next);
});
// Compression for better performance
app.use(compression());
// Define the rate limiter
const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: false, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(apiLimiter);

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  },
});

app.use(csrfProtection);

// Get the CSRF token
app.get('/csrf-token', (req, res) => {
  res.status(200).json({ csrfToken: req.csrfToken() });
});

// Middleware to check if the user is authenticated (place this after the CSRF protection middleware for each route that requires authentication)
const isAuthenticated = (req, res, next) => {
  // Check if the user is authenticated by verifying the JWT auth header
  const jwtoken = req.headers.authorization?.split(' ')[1];
  if (!jwtoken) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  jwtVerify(jwtoken, process.env.JWT_SECRET)
    .then(decoded => {
      req.user = decoded; // Attach the decoded user info to the request object
      next(); // Proceed to the next middleware or route handler
    })
    .catch(() => {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    });
};

// Register New User Route
app.post("/register", csrfProtection, async (req, res) => {
  const { username, password } = req.body;

  // Validate username
  if (username.length < 5 || username.length > 50) {
    return res.status(406).json({ message: "Invalid email format." });
  }
  // Validate password
  if (!password || password.length < 8) {
    return res.status(406).json({ message: "Password must be at least 8 characters long 🚧" });
  }

  try {
    // Check if username already exists in the sqlite database
    const existingUser = await User.findOne({ where: { username: username } });
    if (existingUser) {
      return res.status(406).json({ message: "This username is unavailable." });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create and store the new user
    const newUser = await User.create({
      username: username,
      password: hashedPassword,
      token: null, // Initially no token
      last_login: new Date().toISOString(),
      date_created: new Date().toISOString(),
    });

    // Generate a JWT
    const jwtoken = jwt.sign({ id: newUser.id, username: newUser.username, apiToken: newUser.token }, JWT_SECRET, { expiresIn: "12h" });

    // Respond with the token and user data
    res.status(201).json({
      message: "User created successfully!",
      jwt: jwtoken,
      user: { id: newUser.id, username: newUser.username },
    });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ message: "Error creating your profile. Please try again." });
  }
});

app.post("/login", csrfProtection, async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ where: { username: username } });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password. Please create an account below if you need to 🧠" });
    }

    // Validate password
    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long 🚧" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password. Please create an account below if you need to 📚" });
    }

    // Check if the user has a token
    if (user.token) {
      const token = user.token;
      // Set the token cookie
      res.cookie('apiToken', token, {
        expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        secure: process.env.NODE_ENV === "production", // Use HTTPS in production
        sameSite: 'Lax', // Adjust based on cross-domain requirements
        httpOnly: true // Prevent client-side JavaScript from accessing the cookie
      });
    }

    // Generate a JWT
    const jwtoken = jwt.sign({ id: user.id, username: user.username, apiToken: user.token }, JWT_SECRET, { expiresIn: "12h" });
    console.log("Generated JWT for user:", user.id);

    // Update the user's last login time
    await updateLastLogin(user.id);

    // Respond with the user information and token
    res.json({
      message: "Login successful!",
      user: {
        id: user.id,
        username: user.username,
        jwt: jwtoken,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login. Please try again." });
  }
});

// Reset Password Route
app.post("/reset-password", csrfProtection, async (req, res) => {
  const { username, newPassword } = req.body;

  // Validate input
  if (!username || !newPassword) {
    return res.status(400).json({ message: "Username and new password are required." });
  }

  try {
    // Find the user by username
    const user = await User.findOne({ where: { username: username } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({ message: "An error occurred during password reset. Please try again." });
  }
});

// Get User Info Route
app.get("/user", csrfProtection, isAuthenticated, async (req, res) => {
  try {
    // Get the username from the JWT
    const username = req.user.username;
    if (!username) {
      return res.status(401).json({ message: "Unauthorized: No username found in token." });
    }

    // Fetch user information from the database
    const user = await User.findOne({ where: { username: req.user.username } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Respond with user information
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "An error occurred while fetching user info." });
  }
});

// Logout Route
app.post("/logout", csrfProtection, (req, res) => {
  // Clear the session
  req.session.destroy(err => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).json({ message: "An error occurred during logout. Please try again." });
    }
    res.clearCookie('apiToken', { secure: process.env.NODE_ENV === "production", sameSite: 'Lax', httpOnly: true });
    res.status(200).json({ message: "Logout successful." });
  });
});

// Add a token from POST request
app.post('/token/add', csrfProtection, isAuthenticated, async (req, res) => {
    // Extract the token from the request body
    const newToken = req.body.token;
    if (!newToken) {
        return res.status(400).json({ error: 'API Token is required' });
    }
    // Get the username from the JWT
    const username = req.user.username;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }
    const user = await User.findOne({ where: { username: username } });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    // Get all tokens from the database to see if the token already exists
    const token = await User.getToken(user.id);
    if (token) {
        console.log('Token already exists, updating it instead.', token);
        await User.updateToken(user.id, newToken)
            .then(result => {
                console.log('Token updated successfully:', result);
                // Update the token cookie
                res.cookie('apiToken', newToken, { expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), secure: process.env.NODE_ENV === "production", sameSite: 'Lax', httpOnly: true });
                return res.status(200).json({ newToken });
            })
            .catch(err => res.status(501).json({ error: err.message }));
    } else {
        // If no token exists, add a new one
        await User.addToken(user.id, newToken)
            .then(result => {
                // Set the token cookie
                res.cookie('apiToken', newToken, { expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), secure: process.env.NODE_ENV === "production", sameSite: 'Lax', httpOnly: true });
                return res.status(201).json({ message: 'Token added and cookie set', token: result.token });
            })
            .catch(err => {
                res.status(500).json({ error: err.message });
            });
    }
});

// Delete a token
app.post('/token/delete', isAuthenticated, async (req, res) => {
      // Get the username from the JWT
    const username = req.user.username;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }
    const user = await User.findOne({ where: { username: username } });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    // Clear the token cookie
    console.log('Clearing token cookie');
    const token = req.cookies.apiToken;
    if (!token) {
        return res.status(400).json({ error: 'API Token is required' });
    }
    try {
        // Clear the token cookie
        res.clearCookie('apiToken', { secure: process.env.NODE_ENV === "production", sameSite: 'Lax', httpOnly: true });
    } catch (err) {
        console.error('Error clearing token cookie:', err);
        return res.status(500).json({ error: 'Failed to clear token cookie' });
    }
    // Delete the token from the database
    await User.deleteToken(user.id)
        .then(result => {
            return res.status(200).json({ message: 'Token deleted and cookie cleared', result });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        });
});

// Get a token
app.get('/token/get', isAuthenticated, async (req, res) => {
    // Get the username from the JWT
    const username = req.user.username;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }
    const user = await User.findOne({ where: { username: username } });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    // Get the token from the database
    await User.getToken(user.id)
        .then(token => {
            if (token) {
                return res.status(200).json({ token });
            } else {
                return res.status(404).json({ error: 'No token found' });
            }
        })
        .catch(err => res.status(500).json({ error: err.message }));
});

// Add a token from POST request
app.post('/plan/add', csrfProtection, isAuthenticated, async (req, res) => {
    // Extract the plan data from the request body
    const planData = req.body;
    if (!planData || Object.keys(planData).length === 0) {
        return res.status(400).json({ error: 'Plan data is required' });
    }
    // Add the plan data to the database
    await addLowDBData(planData)
        .then(result => {
            return res.status(201).json({ message: 'Plan added successfully', result });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        });
});

// Clear databases
app.post('/db/clear', csrfProtection, async (req, res) => {
    // Clear the databases
    await clearLowDBData() && await clearSqliteData()
        .then(() => {
            return res.status(200).json({ message: 'Databases successfully cleared' });
        })
        .catch(err => {
            return res.status(500).json({ error: err.message });
        });
});

app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
});
