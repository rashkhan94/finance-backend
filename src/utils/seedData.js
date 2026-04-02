/**
 * Seed script — populates the database with sample data for testing/demo.
 * Run with: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');
const User = require('../models/User');
const FinancialRecord = require('../models/FinancialRecord');

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
  },
  {
    name: 'Analyst User',
    email: 'analyst@example.com',
    password: 'analyst123',
    role: 'analyst',
  },
  {
    name: 'Viewer User',
    email: 'viewer@example.com',
    password: 'viewer123',
    role: 'viewer',
  },
];

const getRandomDate = (monthsBack) => {
  const date = new Date();
  date.setMonth(date.getMonth() - Math.floor(Math.random() * monthsBack));
  date.setDate(Math.floor(Math.random() * 28) + 1);
  return date;
};

const incomeCategories = ['salary', 'freelance', 'investments'];
const expenseCategories = [
  'rent', 'utilities', 'groceries', 'transport',
  'entertainment', 'healthcare', 'education', 'shopping',
  'travel', 'insurance', 'taxes',
];

const generateRecords = (adminId) => {
  const records = [];

  // generate some income records
  for (let i = 0; i < 15; i++) {
    const category = incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
    records.push({
      amount: Math.round((Math.random() * 10000 + 1000) * 100) / 100,
      type: 'income',
      category,
      date: getRandomDate(10),
      description: `${category} payment received`,
      createdBy: adminId,
    });
  }

  // generate some expense records
  for (let i = 0; i < 30; i++) {
    const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
    records.push({
      amount: Math.round((Math.random() * 3000 + 50) * 100) / 100,
      type: 'expense',
      category,
      date: getRandomDate(10),
      description: `${category} expense`,
      createdBy: adminId,
    });
  }

  return records;
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(config.mongo.uri);
    console.log('Connected to MongoDB for seeding...');

    // clear existing data
    await User.deleteMany({});
    await FinancialRecord.deleteMany({});
    console.log('Cleared existing data.');

    // create users (password hashing is handled by the pre-save hook)
    const createdUsers = await User.create(sampleUsers);
    console.log(`Created ${createdUsers.length} users.`);

    const adminUser = createdUsers.find((u) => u.role === 'admin');

    // generate and insert financial records
    const records = generateRecords(adminUser._id);
    await FinancialRecord.insertMany(records);
    console.log(`Created ${records.length} financial records.`);

    console.log('\n--- Seed Complete ---');
    console.log('Login credentials:');
    sampleUsers.forEach((u) => {
      console.log(`  ${u.role.padEnd(8)} -> ${u.email} / ${u.password}`);
    });
    console.log('');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();
