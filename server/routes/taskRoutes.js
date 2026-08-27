const express = require('express');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(authorize('Admin', 'Management', 'Project Manager'), createTask);

router.route('/:id')
  .put(updateTask)
  .delete(authorize('Admin', 'Management', 'Project Manager'), deleteTask);

module.exports = router;
