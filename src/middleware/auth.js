const bcrypt = require('bcryptjs');
const User = require('../model/usersSchema');
const { generateToken, verifyToken } = require('../authorization/jwt');



// User Registration
const registerUser = async (data) => {

    try {
        const { email } = data;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return { message: "User already exists!" }
        } else {
            const newUser = new User(data);
            await newUser.save();
            return { message: "User registered successfully", data: newUser }
        }
    } catch (err) {
        console.error(err)
        return { message: "Error registering user", error: err.message };
    }
};



// User Login
const userLogin = async (data) => {
    try {
        const { email, password } = data;
        const user = await User.findOne({ email });

        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return { message: 'Invalid credentials' };
            const token = generateToken(user);
            return {message: 'Login successful', token  }
        } else {
            return { message: 'User not found' }
        }
    } catch (err) {
        console.error(err)
        return { message: 'Error logging in', error: err.message };
    }
};



  // Verify JWT
  const authenticate = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = verifyToken(token); 
        // req.userId = decoded.userId; 
        next();
    } catch (err) {
        console.error(err);
        return res.status(400).json({ message: 'Invalid token' });
    }
};



module.exports = { registerUser, userLogin,authenticate }