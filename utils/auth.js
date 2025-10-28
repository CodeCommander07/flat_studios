import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Sign JWT Token
export const signToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '5d' }
  );
};

// Verify JWT Token
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Hash password using bcrypt
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Compare raw password with hash
export const comparePassword = async (plain, hash) => {
  return await bcrypt.compare(plain, hash);
};

// Generate a random password
export function generateRandomPassword(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function logout(router) {
  localStorage.removeItem('User'); // clear stored session
  router.push('/');      // redirect to login
}
