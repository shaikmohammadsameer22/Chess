import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: false }, // ✅ optional for Google users
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: false }, // ✅ optional for Google users
  googleId: { type: String }, // ✅ support Google login
  rating:   { type: Number, default: 1000 },
});

const User = mongoose.model('User', userSchema);
export default User;
