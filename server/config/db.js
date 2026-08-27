const mongoose = require('mongoose');
const User = require('../models/User');

const seedUsers = async () => {
  const defaultUsers = [
    {
      name: 'System Admin',
      email: 'admin@crm.com',
      password: 'admin123',
      role: 'Admin',
      isActive: true
    },
    {
      name: 'Operations Manager',
      email: 'management@crm.com',
      password: 'management123',
      role: 'Management',
      isActive: true
    },
    {
      name: 'Sales Representative',
      email: 'sales@crm.com',
      password: 'sales123',
      role: 'Sales',
      isActive: true
    },
    {
      name: 'Project Manager PM',
      email: 'pm@crm.com',
      password: 'pm123456',
      role: 'Project Manager',
      isActive: true
    },
    {
      name: 'Software Engineer',
      email: 'employee@crm.com',
      password: 'employee123',
      role: 'Employee',
      isActive: true
    },
    {
      name: 'Finance Executive',
      email: 'finance@crm.com',
      password: 'finance123',
      role: 'Finance',
      isActive: true
    }
  ];

  try {
    for (const u of defaultUsers) {
      const userExists = await User.findOne({ email: u.email });
      if (!userExists) {
        await User.create(u);
        console.log(`Seeded user: ${u.email} (${u.role})`);
      }
    }
  } catch (err) {
    console.error(`User seeding failed: ${err.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crm_platform');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedUsers();
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
