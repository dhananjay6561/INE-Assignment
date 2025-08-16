const User = require("../models/User");
const { generateToken } = require("../utils/jwt");

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, passwordHash: password });
    const token = generateToken(user);

    res.status(201).json({ 
      message: "User created successfully",
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: "Signup failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Add debug logging
    console.log('Login attempt:', { email, passwordProvided: !!password });
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    console.log('Login successful for user:', email);
    
    res.json({ 
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: "Login failed" });
  }
};