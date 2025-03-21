import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const candidatePhotos = [
    { id: 18, photo: "/brittany-kinser.jpeg" },
    { id: 19, photo: "/jill-underly.jpeg" },
    { id: 20, photo: "/brad-schimel.jpeg" },
    { id: 21, photo: "/susan-crawford.jpeg" },
  ];

  for (const candidate of candidatePhotos) {
    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { photo: candidate.photo },
    });
  }

  console.log('✅ Candidate photos updated successfully.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Error updating candidate photos:', e);
    prisma.$disconnect();
    process.exit(1);
  });