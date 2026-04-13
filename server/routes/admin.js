const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { listStudents, createStudent, updateStudent } = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(auth, roleGuard('admin'));

router.get('/students', listStudents);
router.post('/students', createStudent);
router.patch('/students/:id', updateStudent);

module.exports = router;
