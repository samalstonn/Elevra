// app/api/v1/candidates/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { handleApiError } from "@/lib/api/errors/error-handler";
import { NotFoundError, ValidationError } from "@/lib/api/errors/error-types";
import { successResponse } from "@/lib/api/responses";
import { logger } from "@/lib/logger";

/**
 * GET /api/v1/candidates/[slug]
 * Retrieves a specific candidate by their unique slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    logger.api.request("GET", request.url);

    const slug = (await params).slug;

    if (!slug) {
      throw new ValidationError("Candidate slug is required");
    }

    // Find the candidate in the database
    const candidate = await prisma.candidate.findUnique({
      where: {
        slug: slug,
        hidden: false, // Only return non-hidden candidates
      },
      include: {
        // Include counts or other aggregated data
        _count: {
          select: {
            donations: true,
            profileViews: true,
            endorsements: true,
          },
        },
      },
    });

    // If no candidate found, throw a NotFoundError
    if (!candidate) {
      throw new NotFoundError("Candidate", slug);
    }

    // Record the profile view (optional)
    await recordProfileView(candidate.id, request);

    // Transform the data if needed before sending the response
    const result = {
      ...candidate,
      // Add any calculated fields
      totalDonations: candidate._count.donations || 0,
      metrics: {
        donations: candidate._count.donations,
        views: candidate._count.profileViews,
        endorsements: candidate._count.endorsements,
      },
    };

    // Remove sensitive or unnecessary fields
    const { _count, ...cleanedResult } = result;

    return successResponse(cleanedResult);
  } catch (error) {
    logger.api.error("GET", request.url, error);
    return handleApiError(error);
  }
}

/**
 * Records a profile view for analytics purposes
 */
async function recordProfileView(candidateId: number, request: NextRequest) {
  try {
    // Get IP address and referrer for analytics
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const referrer = request.headers.get("referer") || "unknown";

    // Create a profile view record
    await prisma.candidateProfileView.create({
      data: {
        candidateId,
        viewerIp: ip,
        userAgent,
        referrerUrl: referrer,
      },
    });
  } catch (error) {
    // Log the error but don't fail the main request if this fails
    logger.error("Failed to record profile view", { candidateId, error });
  }
}
