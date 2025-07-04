import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const hashPassword = async (password) => await bcrypt.hash(password, 10);
export const comparePassword = async (plain, hash) => await bcrypt.compare(plain, hash);
