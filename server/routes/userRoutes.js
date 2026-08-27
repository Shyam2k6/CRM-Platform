const express = require('express');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All user management routes require login
router.use(protect);

router.route('/')
  .get(getUsers)
  .post(authorize('Admin', 'Management'), createUser);

router.route('/:id')
  .put(updateUser)
  .delete(authorize('Admin'), deleteUser);

module.exports = router;
