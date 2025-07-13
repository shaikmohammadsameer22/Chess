import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username: name,
        email,
        googleId,
        password: '', // You can add a dummy password or keep it blank
      });
    }

    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.cookie('token', authToken, {
      httpOnly: true,
      secure: false, // Set true in production
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: 'Google login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rating: user.rating,
      },
    });
  } catch (err) {
    console.error("❌ Google login failed:", err);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set true in production with HTTPS
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'Registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rating: user.rating // ✅ Include rating
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Logged in',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rating: user.rating // ✅ Include rating
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

export const me = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json(null); // ✅ simplified response

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("username email rating _id");
    if (!user) return res.status(404).json(null);

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      rating: user.rating // ✅ Include rating
    });
  } catch {
    res.status(401).json(null);
  }
};
