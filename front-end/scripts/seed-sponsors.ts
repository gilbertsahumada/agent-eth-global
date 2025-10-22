import { db, schema } from '../lib/db/client';
import { randomUUID } from 'crypto';

async function seedSponsors() {
  console.log('🌱 Seeding sponsors...');

  try {
    // Common ETH Global sponsors
    const sponsorsData = [
      {
        id: randomUUID(),
        name: 'Polygon',
        description: 'Ethereum scaling solution providing faster and cheaper transactions',
        website: 'https://polygon.technology/',
        logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
        docUrl: 'https://docs.polygon.technology/',
        category: 'Infrastructure',
        tags: ['Layer 2', 'Scaling', 'EVM'],
        techStack: ['Solidity', 'Web3.js', 'Ethers.js'],
      },
      {
        id: randomUUID(),
        name: 'Chainlink',
        description: 'Decentralized oracle network providing real-world data to smart contracts',
        website: 'https://chain.link/',
        logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png',
        docUrl: 'https://docs.chain.link/',
        category: 'Oracle',
        tags: ['Data Feeds', 'VRF', 'Automation'],
        techStack: ['Solidity', 'JavaScript', 'Python'],
      },
      {
        id: randomUUID(),
        name: 'The Graph',
        description: 'Indexing protocol for querying blockchain data',
        website: 'https://thegraph.com/',
        logo: 'https://cryptologos.cc/logos/the-graph-grt-logo.png',
        docUrl: 'https://thegraph.com/docs/',
        category: 'Infrastructure',
        tags: ['Indexing', 'Querying', 'GraphQL'],
        techStack: ['GraphQL', 'TypeScript', 'AssemblyScript'],
      },
      {
        id: randomUUID(),
        name: 'Uniswap',
        description: 'Leading decentralized exchange protocol',
        website: 'https://uniswap.org/',
        logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
        docUrl: 'https://docs.uniswap.org/',
        category: 'DeFi',
        tags: ['DEX', 'AMM', 'Trading'],
        techStack: ['Solidity', 'React', 'Web3'],
      },
      {
        id: randomUUID(),
        name: 'Filecoin',
        description: 'Decentralized storage network',
        website: 'https://filecoin.io/',
        logo: 'https://cryptologos.cc/logos/filecoin-fil-logo.png',
        docUrl: 'https://docs.filecoin.io/',
        category: 'Storage',
        tags: ['Storage', 'IPFS', 'Data'],
        techStack: ['Go', 'Rust', 'JavaScript'],
      },
      {
        id: randomUUID(),
        name: 'Worldcoin',
        description: 'Privacy-preserving digital identity and financial network',
        website: 'https://worldcoin.org/',
        logo: 'https://worldcoin.org/icons/logo.svg',
        docUrl: 'https://docs.worldcoin.org/',
        category: 'Identity',
        tags: ['Identity', 'Privacy', 'Biometrics'],
        techStack: ['Solidity', 'TypeScript', 'React'],
      },
    ];

    // Generate collection names for each sponsor
    const sponsorsWithCollections = sponsorsData.map(sponsor => ({
      ...sponsor,
      collectionName: `sponsor_${sponsor.id.replace(/-/g, '_')}`,
    }));

    const sponsors = await db.insert(schema.sponsors).values(sponsorsWithCollections).returning();

    console.log('✅ Sponsors seeded successfully:');
    sponsors.forEach(s => console.log(`  - ${s.name} (${s.category})`));

    return sponsors;
  } catch (error) {
    console.error('❌ Error seeding sponsors:', error);
    throw error;
  }
}

// Run if this is the main module
if (require.main === module) {
  seedSponsors()
    .then(() => {
      console.log('✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export { seedSponsors };
