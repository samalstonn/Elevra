// Template for dynamic routes
// app/api/v1/[resource]/[id]/route.ts

import { NextRequest } from "next/server";
import prisma from "@/prisma/prisma";
import {
  handleApiError,
  successResponse,
  emptyResponse,
  NotFoundError,
  requireAuth,
  requireOwnership,
  ValidationError,
} from "@/lib/api";
import { logger } from "@/lib/logger";

/**
 * GET handler for a specific resource by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.api.request("GET", request.url);

    const id = parseInt(params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid ID format", { id: params.id });
    }

    // Fetch the resource
    const resource = await prisma.yourModel.findUnique({
      where: { id },
    });

    // Check if resource exists
    if (!resource) {
      throw new NotFoundError("Resource", id);
    }

    // Return the resource
    return successResponse(resource);
  } catch (error) {
    logger.api.error("GET", request.url, error);
    return handleApiError(error);
  }
}

/**
 * PUT handler to update a resource
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.api.request("PUT", request.url);

    // Get authenticated user
    const userId = await requireAuth();

    const id = parseInt(params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid ID format", { id: params.id });
    }

    // Find the resource
    const resource = await prisma.yourModel.findUnique({
      where: { id },
    });

    // Check if resource exists
    if (!resource) {
      throw new NotFoundError("Resource", id);
    }

    // Check ownership
    await requireOwnership(resource.createdBy);

    // Parse and validate request body
    const data = await validateRequest(request, UpdateResourceSchema);

    // Update the resource
    const updatedResource = await prisma.yourModel.update({
      where: { id },
      data,
    });

    // Return updated resource
    return successResponse(updatedResource);
  } catch (error) {
    logger.api.error("PUT", request.url, error);
    return handleApiError(error);
  }
}

/**
 * DELETE handler
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    logger.api.request("DELETE", request.url);

    // Get authenticated user
    const userId = await requireAuth();

    const id = parseInt(params.id);
    if (isNaN(id)) {
      throw new ValidationError("Invalid ID format", { id: params.id });
    }

    // Find the resource
    const resource = await prisma.yourModel.findUnique({
      where: { id },
    });

    // Check if resource exists
    if (!resource) {
      throw new NotFoundError("Resource", id);
    }

    // Check ownership
    await requireOwnership(resource.createdBy);

    // Delete the resource
    await prisma.yourModel.delete({
      where: { id },
    });

    // Return empty response (204 No Content)
    return emptyResponse();
  } catch (error) {
    logger.api.error("DELETE", request.url, error);
    return handleApiError(error);
  }
}
