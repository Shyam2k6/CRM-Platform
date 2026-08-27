const Project = require('../models/Project');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const { clientId, status } = req.query;
    const query = {};

    if (clientId) query.associatedClient = clientId;
    if (status) query.status = status;

    // Employees can only see projects they are assigned to (Team members or PM),
    // Admin, Management and PM can see all.
    if (req.user.role === 'Employee') {
      query.$or = [
        { teamMembers: req.user._id },
        { projectManager: req.user._id }
      ];
    }

    const projects = await Project.find(query)
      .populate('associatedClient', 'companyName contactPerson email')
      .populate('projectManager', 'name email')
      .populate('teamMembers', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project details
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('associatedClient')
      .populate('associatedOpportunity')
      .populate('associatedQuotation')
      .populate('projectManager', 'name email')
      .populate('teamMembers', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private (Admin, Management, Project Manager)
exports.createProject = async (req, res, next) => {
  try {
    const project = await Project.create(req.body);

    await project.populate('associatedClient', 'companyName contactPerson');
    await project.populate('projectManager', 'name email');

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project details
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // PM can update their project, Admin/Management can update any.
    if (
      req.user.role === 'Project Manager' &&
      project.projectManager &&
      project.projectManager.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this project' });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('associatedClient').populate('projectManager').populate('teamMembers');

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin, Management)
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    await project.deleteOne();

    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};
