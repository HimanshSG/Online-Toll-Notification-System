// seed.js
import { connectToDatabase } from './db.js';  // ⬅️ use import (not require)
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; 
import { dirname } from 'path';

const SALT_ROUNDS = 10;

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seed() {
  const db = await connectToDatabase();

  try {
    // Seed admin
    const admin = await db.collection('admins').findOne({ email: 'admin@tollnotify.com' });

    if (!admin) {
      const passwordHash = await bcrypt.hash('admin123', SALT_ROUNDS);
      await db.collection('admins').insertOne({
        name: 'Admin User',
        email: 'admin@tollnotify.com',
        passwordHash,
      });
      console.log('✅ Admin user created successfully');
    } else {
      console.log('ℹ️ Admin already exists, skipping');
    }

    // Load Toll Plazas from toll.json
    const tollDataPath = path.join(__dirname, 'tolls.json');
    const tollData = JSON.parse(fs.readFileSync(tollDataPath, 'utf-8'));

    if (Array.isArray(tollData) && tollData.length > 0) {
      await db.collection('tollplazas').deleteMany({});
      console.log('🧹 Old toll plazas removed');

      const formattedTolls = tollData.map(toll => ({
        name: toll.name,
        latitude: toll.latitude,
        longitude: toll.longitude,
        roadName: toll.roadName,
        tollFee: toll.tollFee,
        createdAt: new Date(toll.createdAt),
        updatedAt: new Date(toll.updatedAt),
      }));

      await db.collection('tollplazas').insertMany(formattedTolls);
      console.log(`✅ Seeded ${formattedTolls.length} toll plazas successfully`);
    } else {
      console.log('⚠️ No toll plazas found in toll.json');
    }

    // Seed test user (only in development)
    if (process.env.NODE_ENV === 'development') {
      const testUser = await db.collection('users').findOne({ email: 'test@example.com' });

      if (!testUser) {
        const passwordHash = await bcrypt.hash('password123', SALT_ROUNDS);
        await db.collection('users').insertOne({
          name: 'Test User',
          email: 'test@example.com',
          passwordHash,
          fastagBalance: 758.50,
          contactNumber: '+919876543210',
          vehicleNumber: 'RJ02 AB 1234',
          fastagId: '34175902648',
          isVerified: true,
        });
        console.log('✅ Test user created successfully (development only)');
      }
    }

    console.log('🎉 Database seeding completed successfully');
  } catch (err) {
    console.error('❌ Error during database seeding:', err);
  }
}

seed();
