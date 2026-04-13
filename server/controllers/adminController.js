const bcrypt = require('bcryptjs');
const Student = require('../models/Student');

// GET /api/admin/students — List all students
exports.listStudents = async (req, res) => {
  try {
    const { block, floor, search } = req.query;
    const query = {};

    if (block) query.block = block;
    if (floor) query.floor = floor;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
        { room: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .select('-password')
      .sort({ block: 1, floor: 1, room: 1 });

    res.json({ success: true, students, total: students.length });
  } catch (error) {
    console.error('List students error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// POST /api/admin/students — Create a student account
exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, rollNo, block, floor, room, phone, isMHMC } = req.body;

    // Validate required fields
    if (!name || !email || !password || !rollNo || !block || !floor || !room) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, password, rollNo, block, floor, room.'
      });
    }

    // Check for duplicates
    const existingStudent = await Student.findOne({
      $or: [{ email: email.toLowerCase() }, { rollNo }, { room }]
    });
    if (existingStudent) {
      let field = 'email';
      if (existingStudent.rollNo === rollNo) field = 'roll number';
      if (existingStudent.room === room) field = 'room';
      return res.status(400).json({
        success: false,
        message: `A student with this ${field} already exists.`
      });
    }

    // If setting isMHMC, check that no other MHMC exists for this block+floor
    if (isMHMC) {
      const existingMHMC = await Student.findOne({ block, floor, isMHMC: true });
      if (existingMHMC) {
        return res.status(400).json({
          success: false,
          message: `An MHMC member already exists for Block ${block}, ${floor} Floor (${existingMHMC.name}).`
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = new Student({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      rollNo,
      block,
      floor,
      room,
      phone: phone || '',
      isMHMC: isMHMC || false
    });

    await student.save();

    // Return without password
    const studentObj = student.toObject();
    delete studentObj.password;

    res.status(201).json({
      success: true,
      message: 'Student account created successfully.',
      student: studentObj
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/admin/students/:id — Update student details
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // If updating isMHMC to true, verify no conflict
    if (updates.isMHMC === true && !student.isMHMC) {
      const block = updates.block || student.block;
      const floor = updates.floor || student.floor;
      const existingMHMC = await Student.findOne({
        block,
        floor,
        isMHMC: true,
        _id: { $ne: id }
      });
      if (existingMHMC) {
        return res.status(400).json({
          success: false,
          message: `An MHMC member already exists for Block ${block}, ${floor} Floor.`
        });
      }
    }

    // If password is being updated, hash it
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Student updated successfully.',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
