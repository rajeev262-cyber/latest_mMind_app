// scripts/seedUsers.js — Run: node scripts/seedUsers.js
// Seeds 5 pre-defined users into MongoDB

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User     = require('../models/User');

const USERS = [
  { name: 'Mitesh',   username: 'mitesh',   password: '123456', role: 'user'  },
  { name: 'Purva',    username: 'purva',    password: '123456', role: 'user'  },
  { name: 'Priyanka', username: 'priyanka', password: '123456', role: 'user'  },
  { name: 'Manish',   username: 'manish',   password: '123456', role: 'user'  },
  { name: 'Rajeev',   username: 'rajeev',   password: '123456', role: 'admin' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    await User.deleteMany({});
    console.log('🗑  Old users cleared');

    for (const u of USERS) {
      await User.create(u);
      console.log(`   ✓ Created: ${u.username}`);
    }

    console.log('\n🎉 All 5 users seeded successfully!');
    console.log('   Default password for all: 123456');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
