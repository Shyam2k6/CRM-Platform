const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper to recalculate overall Project progress based on completed tasks
const updateProjectProgress = async (projectId) => {
  try {
    const totalTasks = await Task.countDocuments({ associatedProject: projectId });
    const completedTasks = await Task.countDocuments({ associatedProject: projectId, status: 'Completed' });

    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    await Project.findByIdAndUpdate(projectId, { progress });
  } catch (err) {
    console.error('Error updating project progress:', err);
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    const { projectId, assignedTo, status } = req.query;
    const query = {};

    if (projectId) query.associatedProject = projectId;
    if (assignedTo) query.assignedTo = assignedTo;
    if (status) query.status = status;

    // Regular Employee role can only view tasks assigned to them
    if (req.user.role === 'Employee') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('associatedProject', 'projectName status')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (Admin, Management, Project Manager)
exports.createTask = async (req, res, next) => {
  try {
    const task = await Task.create(req.body);

    // Update associated project progress
    await updateProjectProgress(task.associatedProject);

    await task.populate('assignedTo', 'name email');
    await task.populate('associatedProject', 'projectName');

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details / status
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    // Role check: Employee can only update the status of their assigned tasks
    if (req.user.role === 'Employee') {
      if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: 'Not authorized to update this task' });
      }
      // Restrict fields for Employee - only allow status updates
      req.body = { status: req.body.status };
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('assignedTo', 'name email').populate('associatedProject', 'projectName');

    // Recalculate project progress
    await updateProjectProgress(task.associatedProject);

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin, Management, PM)
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const projectId = task.associatedProject;

    await task.deleteOne();

    // Recalculate project progress
    await updateProjectProgress(projectId);

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};
