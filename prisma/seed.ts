import { candidates } from '../data/test_data';

// Load .env from the project root (adjust the path if your .env is elsewhere)
import { config } from 'dotenv';
config({ path: '../.env' });

if (process.env.NODE_ENV === 'production') {
  process.env.DATABASE_URL = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
}
import prisma from './prisma';

async function main() {
    for (const candidate of candidates) {
        // Update the candidate record by their name and update the bio column
        await prisma.candidate.updateMany({
            where: {
                name: candidate.name,
            },
            data: {
                bio: candidate.bio,
            },
        });
    }
    console.log('Seeding complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });