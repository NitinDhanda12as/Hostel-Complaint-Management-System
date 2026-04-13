require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('./models/Student');
const Admin = require('./models/Admin');
const Complaint = require('./models/Complaint');

const BLOCKS = ['A', 'B', 'C', 'D'];
const FLOORS = ['Ground', '1st', '2nd', '3rd'];

const floorPrefix = {
  'Ground': 'G',
  '1st': '1',
  '2nd': '2',
  '3rd': '3'
};

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Student.deleteMany({}),
      Admin.deleteMany({}),
      Complaint.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Create admin
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    
    await Admin.create({
      name: 'Hostel Manager',
      email: 'admin@nit.ac.in',
      password: adminPassword,
      role: 'admin'
    });
    console.log('👤 Admin created: admin@nit.ac.in / admin123');

    // Create sample students — 4 per floor per block (ground floor heavily populated for testing)
    const students = [];
    let studentCount = 0;

    for (const block of BLOCKS) {
      for (const floor of FLOORS) {
        const fp = floorPrefix[floor];
        const studentsOnFloor = floor === 'Ground' ? 6 : 4;

        for (let i = 1; i <= studentsOnFloor; i++) {
          const roomNum = i.toString().padStart(2, '0');
          const room = `${block}-${fp}${roomNum}`;
          const rollNo = `NIT${block}${fp}${roomNum}`;
          const isMHMC = i === 1; // First student on each floor is MHMC

          const hashedPw = await bcrypt.hash('student123', salt);
          students.push({
            name: `Student ${block}${fp}${roomNum}`,
            email: `${rollNo.toLowerCase()}@nit.ac.in`,
            password: hashedPw,
            rollNo,
            block,
            floor,
            room,
            phone: `98765${(studentCount + 10000).toString().slice(-5)}`,
            isMHMC
          });
          studentCount++;
        }
      }
    }

    await Student.insertMany(students);
    console.log(`🎓 ${studentCount} students created`);
    console.log(`🏅 ${BLOCKS.length * FLOORS.length} MHMC members assigned (1 per floor per block)`);

    // Print some sample credentials
    console.log('\n📋 Sample Login Credentials:');
    console.log('─'.repeat(50));
    console.log('ADMIN:');
    console.log('  Email: admin@nit.ac.in');
    console.log('  Password: admin123');
    console.log('');
    console.log('STUDENTS (all passwords: student123):');
    console.log('  Block A, Ground Floor (MHMC): nitag01@nit.ac.in');
    console.log('  Block A, Ground Floor: nitag02@nit.ac.in');
    console.log('  Block B, 1st Floor (MHMC): nitb101@nit.ac.in');
    console.log('  Block C, 2nd Floor: nitc203@nit.ac.in');
    console.log('  Block D, 3rd Floor: nitd304@nit.ac.in');
    console.log('─'.repeat(50));

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDB();
