const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and role are required.'
      });
    }

    let user;
    if (role === 'admin') {
      user = await Admin.findOne({ email: email.toLowerCase() });
    } else if (role === 'student') {
      user = await Student.findOne({ email: email.toLowerCase() });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "student" or "admin".'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Build JWT payload
    const payload = {
      userId: user._id,
      email: user.email,
      role: role
    };

    if (role === 'student') {
      payload.block = user.block;
      payload.floor = user.floor;
      payload.room = user.room;
      payload.isMHMC = user.isMHMC;
      payload.name = user.name;
      payload.rollNo = user.rollNo;
    } else {
      payload.name = user.name;
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
        ...(role === 'student' && {
          block: user.block,
          floor: user.floor,
          room: user.room,
          rollNo: user.rollNo,
          isMHMC: user.isMHMC,
          phone: user.phone
        })
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.'
    });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const { userId, role } = req.user;

    let user;
    if (role === 'admin') {
      user = await Admin.findById(userId).select('-password');
    } else {
      user = await Student.findById(userId).select('-password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
        ...(role === 'student' && {
          block: user.block,
          floor: user.floor,
          room: user.room,
          rollNo: user.rollNo,
          isMHMC: user.isMHMC,
          phone: user.phone
        })
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};
