import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

export async function POST(request: Request): Promise<Response> {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { vendorId, candidateId, message } = body;

    // Validate required fields
    if (!vendorId || !candidateId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if the vendor exists and belongs to the authenticated user
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (vendor.clerkUserId !== userId) {
      return NextResponse.json(
        {
          error: "You do not have permission to send requests for this vendor",
        },
        { status: 403 }
      );
    }

    // Check if the candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check if there's already a testimonial from this candidate for this vendor
    const existingTestimonial = await prisma.testimonial.findFirst({
      where: {
        vendorId,
        candidateId,
      },
    });

    if (existingTestimonial) {
      return NextResponse.json(
        { error: "This candidate has already provided a testimonial" },
        { status: 409 }
      );
    }

    // In a real implementation, we would send an email to the candidate here
    // For now, we'll just create a record of the request

    // For demo purposes, we'll create a placeholder testimonial with pending status
    // In a real implementation, you would have a separate model for testimonial requests

    // This is a simplified example - in production, you would:
    // 1. Store the request in a database
    // await prisma.testimonialRequest.create({
    // data: {
    //     vendorId,
    //     candidateId,
    //     message,
    //     status: 'PENDING',
    //     requestedAt: new Date(),
    // },
    // });

    // 2. Generate a unique link for the candidate to submit their testimonial
    // 3. Send an email to the candidate with the link

    // Mock success response
    return NextResponse.json({
      success: true,
      message: "Testimonial request sent successfully",
      details: {
        vendorId,
        candidateId,
        candidateName: candidate.name,
        requestedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error updating candidate:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Unknown error updating candidate:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
