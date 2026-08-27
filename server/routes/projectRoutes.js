const express = require('express');
const { getProjects, getProject, createProject, updateProject, deleteProject } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(authorize('Admin', 'Management', 'Project Manager', 'Sales'), createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(authorize('Admin', 'Management'), deleteProject);

module.exports = router;
