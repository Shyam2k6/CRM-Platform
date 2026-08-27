const Lead = require('../models/Lead');

// @desc    Get all leads (with search, filter, and pagination)
// @route   GET /api/leads
// @access  Private (Admin, Management, Sales)
exports.getLeads = async (req, res, next) => {
  try {
    const { search, status, source, assignedSalesperson, page = 1, limit = 10 } = req.query;

    const query = {};

    // Apply role-based filtering: Sales can only see their assigned leads (if required, or let them see all. We will allow them to see all by default, but prioritize their own. Let's make it so Sales can see all but filter by assigned salesperson if needed. To build a true collaborative workspace, we allow viewing but restrict edit/delete based on owner if wanted. Let's keep it simple: all team members see all leads).
    
    // Search filter (name, company, email)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { requirement: { $regex: search, $options: 'i' } }
      ];
    }

    // Direct filters
    if (status) query.status = status;
    if (source) query.source = source;
    if (assignedSalesperson) query.assignedSalesperson = assignedSalesperson;

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;

    const total = await Lead.countDocuments(query);

    const leads = await Lead.find(query)
      .populate('assignedSalesperson', 'name email')
      .populate('convertedToOpportunity', 'title dealValue stage')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: leads.length,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      },
      data: leads
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
exports.getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedSalesperson', 'name email')
      .populate('convertedToOpportunity');

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Create lead
// @route   POST /api/leads
// @access  Private
exports.createLead = async (req, res, next) => {
  try {
    // If not specified, default assigned salesperson to the creating user if they are Sales
    if (!req.body.assignedSalesperson && req.user.role === 'Sales') {
      req.body.assignedSalesperson = req.user._id;
    }

    const lead = await Lead.create(req.body);

    // Populate salesperson details before responding
    await lead.populate('assignedSalesperson', 'name email');

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
exports.updateLead = async (req, res, next) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Role check: Salesperson can update their assigned leads or unassigned leads.
    // Admin & Management can update any lead.
    if (
      req.user.role === 'Sales' &&
      lead.assignedSalesperson &&
      lead.assignedSalesperson.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, error: 'You are not authorized to update this lead' });
    }

    lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('assignedSalesperson', 'name email');

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private (Admin, Management)
exports.deleteLead = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    await lead.deleteOne();

    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    next(error);
  }
};
