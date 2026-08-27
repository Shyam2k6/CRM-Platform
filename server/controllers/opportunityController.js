const Opportunity = require('../models/Opportunity');
const Lead = require('../models/Lead');

// @desc    Get all opportunities
// @route   GET /api/opportunities
// @access  Private (Admin, Management, Sales)
exports.getOpportunities = async (req, res, next) => {
  try {
    const { stage, assignedSalesperson, search } = req.query;
    const query = {};

    if (stage) query.stage = stage;
    if (assignedSalesperson) query.assignedSalesperson = assignedSalesperson;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const opportunities = await Opportunity.find(query)
      .populate('assignedSalesperson', 'name email')
      .populate('associatedLead', 'name company email')
      .populate('associatedClient', 'companyName contactPerson')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: opportunities.length,
      data: opportunities
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single opportunity
// @route   GET /api/opportunities/:id
// @access  Private
exports.getOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('assignedSalesperson', 'name email')
      .populate('associatedLead')
      .populate('associatedClient');

    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }

    res.status(200).json({ success: true, data: opportunity });
  } catch (error) {
    next(error);
  }
};

// @desc    Create opportunity
// @route   POST /api/opportunities
// @access  Private
exports.createOpportunity = async (req, res, next) => {
  try {
    // If Salesperson is logging it, assign it to them by default
    if (!req.body.assignedSalesperson && req.user.role === 'Sales') {
      req.body.assignedSalesperson = req.user._id;
    }

    const opportunity = await Opportunity.create(req.body);

    // If linked to a lead, mark that lead as Converted
    if (req.body.associatedLead) {
      await Lead.findByIdAndUpdate(req.body.associatedLead, {
        status: 'Converted',
        convertedToOpportunity: opportunity._id
      });
    }

    await opportunity.populate('assignedSalesperson', 'name email');

    res.status(201).json({ success: true, data: opportunity });
  } catch (error) {
    next(error);
  }
};

// @desc    Update opportunity
// @route   PUT /api/opportunities/:id
// @access  Private
exports.updateOpportunity = async (req, res, next) => {
  try {
    let opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }

    // Role check: Sales can only update their assigned opportunities
    if (
      req.user.role === 'Sales' &&
      opportunity.assignedSalesperson &&
      opportunity.assignedSalesperson.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this opportunity' });
    }

    opportunity = await Opportunity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('assignedSalesperson', 'name email');

    res.status(200).json({ success: true, data: opportunity });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete opportunity
// @route   DELETE /api/opportunities/:id
// @access  Private (Admin, Management)
exports.deleteOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }

    await opportunity.deleteOne();

    res.status(200).json({ success: true, message: 'Opportunity deleted successfully' });
  } catch (error) {
    next(error);
  }
};
