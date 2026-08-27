const Client = require('../models/Client');
const Opportunity = require('../models/Opportunity');
const Lead = require('../models/Lead');

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
exports.getClients = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await Client.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single client profile details
// @route   GET /api/clients/:id
// @access  Private
exports.getClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id).populate('originOpportunity');

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client account not found' });
    }

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

// @desc    Create client manually
// @route   POST /api/clients
// @access  Private
exports.createClient = async (req, res, next) => {
  try {
    const clientExists = await Client.findOne({ companyName: req.body.companyName });
    if (clientExists) {
      return res.status(400).json({ success: false, error: 'A client with this company name already exists' });
    }

    const client = await Client.create(req.body);
    res.status(201).json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

// @desc    Update client profile
// @route   PUT /api/clients/:id
// @access  Private
exports.updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client account not found' });
    }

    res.status(200).json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private (Admin, Management)
exports.deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ success: false, error: 'Client account not found' });
    }

    await client.deleteOne();

    res.status(200).json({ success: true, message: 'Client account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Convert Won Opportunity to Client
// @route   POST /api/clients/convert-opportunity/:oppId
// @access  Private
exports.convertOpportunityToClient = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findById(req.params.oppId);

    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }

    // Check if client with this companyName already exists
    let client = await Client.findOne({ companyName: opportunity.clientName });

    if (!client) {
      // Find associated lead details if available
      let contactPerson = opportunity.clientName;
      let email = 'contact@' + opportunity.clientName.toLowerCase().replace(/\s+/g, '') + '.com';
      let phone = '';

      if (opportunity.associatedLead) {
        const lead = await Lead.findById(opportunity.associatedLead);
        if (lead) {
          contactPerson = lead.name;
          email = lead.email;
          phone = lead.phone;
        }
      }

      // Create client
      client = await Client.create({
        companyName: opportunity.clientName,
        contactPerson,
        email,
        phone,
        originOpportunity: opportunity._id
      });
    }

    // Link opportunity to client and set stage to Won
    opportunity.stage = 'Won';
    opportunity.associatedClient = client._id;
    await opportunity.save();

    res.status(200).json({
      success: true,
      message: 'Opportunity successfully converted to Client',
      data: client
    });
  } catch (error) {
    next(error);
  }
};
