import { db, schema } from '../lib/db/client';

async function verify() {
  console.log('🔍 Verifying seed data...\n');

  try {
    // Check hackathons
    const hackathons = await db.select().from(schema.hackathons);
    console.log(`📊 Hackathons: ${hackathons.length}`);
    hackathons.forEach(h => {
      console.log(`  - ${h.name} (${h.location}) ${h.isActive ? '✓ ACTIVE' : ''}`);
    });

    // Check sponsors
    const sponsors = await db.select().from(schema.sponsors);
    console.log(`\n📊 Sponsors: ${sponsors.length}`);
    sponsors.forEach(s => {
      console.log(`  - ${s.name} (${s.category}) - Collection: ${s.collectionName}`);
    });

    // Check relationships
    const relationships = await db.select().from(schema.hackathonSponsors);
    console.log(`\n📊 Hackathon-Sponsor Relationships: ${relationships.length}`);

    console.log('\n✅ Verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verify();
