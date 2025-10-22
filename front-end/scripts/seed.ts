import { seedHackathons } from './seed-hackathons';
import { seedSponsors } from './seed-sponsors';

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  try {
    await seedHackathons();
    console.log('');
    await seedSponsors();

    console.log('\n✅ All seeds completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
