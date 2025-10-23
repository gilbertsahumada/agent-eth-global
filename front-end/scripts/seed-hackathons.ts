import { db, schema } from '../lib/db/client';

async function seedHackathons() {
  console.log('🌱 Seeding hackathons...');

  try {
    // First, delete all existing hackathons
    console.log('🗑️  Deleting existing hackathons...');
    await db.delete(schema.hackathons);
    console.log('✅ Existing hackathons deleted');

    // Insert hackathons
    const hackathons = await db.insert(schema.hackathons).values([
      {
        name: 'ETH Global Online',
        location: 'Online',
        startDate: new Date('2024-09-15'),
        endDate: new Date('2024-09-29'),
        description: 'Join developers from around the world in this virtual hackathon. Build innovative blockchain solutions and compete for prizes.',
        website: 'https://ethglobal.com/events/online',
        isActive: true, // Set as active by default
      },
      {
        name: 'ETH Global Buenos Aires',
        location: 'Buenos Aires, Argentina',
        startDate: new Date('2024-11-01'),
        endDate: new Date('2024-11-03'),
        description: 'Experience the vibrant blockchain community in Buenos Aires. Network, learn, and build with top developers in Latin America.',
        website: 'https://ethglobal.com/events/buenosaires',
        isActive: false, // Not active initially
      },
    ]).returning();

    console.log('✅ Hackathons seeded successfully:');
    hackathons.forEach(h => console.log(`  - ${h.name} (${h.location})`));

    return hackathons;
  } catch (error) {
    console.error('❌ Error seeding hackathons:', error);
    throw error;
  }
}

// Run if this is the main module
if (require.main === module) {
  seedHackathons()
    .then(() => {
      console.log('✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export { seedHackathons };
