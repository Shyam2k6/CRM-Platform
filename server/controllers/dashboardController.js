const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Opportunity = require('../models/Opportunity');
const Project = require('../models/Project');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Activity = require('../models/Activity');

// @desc    Get dashboard summary statistics and chart aggregates
// @route   GET /api/dashboard
// @access  Private (Admin, Management, PM, Finance, Sales)
exports.getDashboardStats = async (req, res, next) => {
  try {
    // 1. Basic Counts
    const totalLeads = await Lead.countDocuments();
    const totalClients = await Client.countDocuments();
    const activeOpportunities = await Opportunity.countDocuments({ stage: { $nin: ['Won', 'Lost'] } });
    const wonDeals = await Opportunity.countDocuments({ stage: 'Won' });
    const activeProjects = await Project.countDocuments({ status: { $ne: 'Completed' } });

    // 2. Financial Calculations
    // Revenue is the sum of all payments received
    const paymentAggregate = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = paymentAggregate.length > 0 ? paymentAggregate[0].total : 0;

    // Pending payments is the sum of due amounts in invoices
    const invoiceAggregate = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$dueAmount' } } }
    ]);
    const pendingPayments = invoiceAggregate.length > 0 ? invoiceAggregate[0].total : 0;

    // 3. Pipeline Funnel Aggregation
    const pipelineData = await Opportunity.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$dealValue' } } }
    ]);
    const formattedPipeline = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'].map(stage => {
      const match = pipelineData.find(d => d._id === stage);
      return {
        stage,
        count: match ? match.count : 0,
        value: match ? match.value : 0
      };
    });

    // 4. Project Status Aggregation
    const projectData = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const formattedProjectStats = ['Not Started', 'In Progress', 'On Hold', 'Completed'].map(status => {
      const match = projectData.find(d => d._id === status);
      return {
        status,
        count: match ? match.count : 0
      };
    });

    // 5. Revenue Trend (Monthly Cashflow)
    // Pull last 6 months cashflow
    const dateLimit = new Date();
    dateLimit.setMonth(dateLimit.getMonth() - 5);
    dateLimit.setDate(1); // start of month 6 months ago

    const revenueTrend = await Payment.aggregate([
      { $match: { paymentDate: { $gte: dateLimit } } },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const formattedTrend = revenueTrend.map(trend => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        name: `${monthNames[trend._id.month - 1]} ${trend._id.year}`,
        Revenue: trend.revenue
      };
    });

    // 6. Feeds lists
    const recentActivities = await Activity.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentDeals = await Opportunity.find({ stage: 'Won' })
      .populate('assignedSalesperson', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    const recentProjects = await Project.find()
      .populate('associatedClient', 'companyName')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentPayments = await Payment.find()
      .populate({
        path: 'associatedInvoice',
        select: 'invoiceNumber associatedClient',
        populate: { path: 'associatedClient', select: 'companyName' }
      })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalLeads,
          totalClients,
          activeOpportunities,
          wonDeals,
          activeProjects,
          totalRevenue,
          pendingPayments
        },
        charts: {
          pipeline: formattedPipeline,
          projects: formattedProjectStats,
          trend: formattedTrend
        },
        feeds: {
          recentActivities,
          recentDeals,
          recentProjects,
          recentPayments
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
