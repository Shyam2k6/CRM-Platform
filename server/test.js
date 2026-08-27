const mongoose = require('mongoose');
const User = require('./models/User');
const Lead = require('./models/Lead');
const Opportunity = require('./models/Opportunity');
const Project = require('./models/Project');

const runTests = async () => {
  console.log('--- Starting CRM Logic Unit Tests ---');
  
  // 1. Test User email regex validation
  try {
    const invalidUser = new User({ email: 'bad-email' });
    await invalidUser.validate();
    console.error('FAIL: User validation should have failed with bad email');
  } catch (err) {
    if (err.errors.email && err.errors.name && err.errors.password) {
      console.log('PASS: User validation caught bad email and missing fields');
    } else {
      console.error('FAIL: Unexpected user validation error', err);
    }
  }

  // 2. Test Lead required fields validation
  try {
    const invalidLead = new Lead({ name: '', company: '' });
    await invalidLead.validate();
    console.error('FAIL: Lead validation should have failed with empty fields');
  } catch (err) {
    if (err.errors.name && err.errors.company && err.errors.email && err.errors.requirement) {
      console.log('PASS: Lead validation caught empty name, company, email, and requirements');
    } else {
      console.error('FAIL: Unexpected lead validation error', err);
    }
  }

  // 3. Test Opportunity Valuation limit checks
  try {
    const invalidOpp = new Opportunity({ dealValue: -500 });
    await invalidOpp.validate();
    console.error('FAIL: Opportunity dealValue should not allow negative numbers');
  } catch (err) {
    if (err.errors.dealValue) {
      console.log('PASS: Opportunity validation caught negative deal value');
    } else {
      console.error('FAIL: Unexpected opportunity validation error', err);
    }
  }

  // 4. Test Project budget validation limit checks
  try {
    const invalidProj = new Project({ budget: -100 });
    await invalidProj.validate();
    console.error('FAIL: Project budget should not allow negative numbers');
  } catch (err) {
    if (err.errors.budget) {
      console.log('PASS: Project validation caught negative budget');
    } else {
      console.error('FAIL: Unexpected project validation error', err);
    }
  }

  console.log('--- CRM Unit Tests Finished ---');
  process.exit(0);
};

runTests();
