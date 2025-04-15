import { PrismaClient, SubmissionStatus } from "@prisma/client";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const validationRequests = await prisma.userValidationRequest.findMany();

  for (const request of validationRequests) {
    const candidate = await prisma.candidate.findUnique({
      where: { id: request.candidateId },
    });

    if (!candidate) {
      console.warn(`Candidate not found for ID ${request.candidateId}`);
      continue;
    }

    if (candidate.electionId !== request.electionId) {
      console.warn(
        `Election ID mismatch for candidate ${candidate.id}. Expected ${candidate.electionId}, got ${request.electionId}`
      );
      continue;
    }

    // Perform update
    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        name: request.fullName,
        website: request.website || null,
        linkedin: request.linkedin || null,
        city: request.city,
        state: request.state,
        position: request.position,
        additionalNotes: request.additionalInfo || null,
        email: request.email,
        phone: request.phone,
        status: SubmissionStatus.APPROVED,
        verified: true,
        clerkUserId: request.clerkUserId,
      },
    });

    console.log(
      `Updated candidate ${updatedCandidate.name} (ID ${updatedCandidate.id})`
    );

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.MY_EMAIL,
      subject: `Candidate Verified: ${updatedCandidate.name}`,
      text: `Candidate ${updatedCandidate.name} has been verified and updated from a UserValidationRequest.`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Confirmation email sent for ${updatedCandidate.name}`);
    } catch (err) {
      console.error(`Failed to send email for ${updatedCandidate.name}:`, err);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error running validation updater:", err);
  process.exit(1);
});
