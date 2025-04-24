// // Template for your API routes
// // app/api/v1/[resource]/route.ts

// import { NextRequest } from "next/server";
// import { z } from "zod";
// import prisma from "@/prisma/prisma";
// import {
//   handleApiError,
//   successResponse,
//   paginatedResponse,
//   validateRequest,
//   validateQuery,
//   requireAuth,
// } from "@/lib/api";
// import { logger } from "@/lib/logger";

// // Define your schemas
// const CreateResourceSchema = z.object({
//   // Define your schema fields here
// });

// const QueryParamsSchema = z.object({
//   // Define query parameter schema here
// });

// /**
//  * GET handler
//  */
// export async function GET(request: NextRequest) {
//   try {
//     logger.api.request("GET", request.url);

//     // Parse query parameters
//     const { searchParams } = new URL(request.url);
//     const query = validateQuery(searchParams, QueryParamsSchema);

//     // Your logic here
//     const data = await prisma.yourModel.findMany({
//       // Your query options
//     });

//     // Return successful response
//     return successResponse(data);
//   } catch (error) {
//     logger.api.error("GET", request.url, error);
//     return handleApiError(error);
//   }
// }

// /**
//  * POST handler
//  */
// export async function POST(request: NextRequest) {
//   try {
//     logger.api.request("POST", request.url);

//     // Ensure user is authenticated
//     const userId = await requireAuth();

//     // Validate request body
//     const data = await validateRequest(request, CreateResourceSchema);

//     // Your logic here
//     const result = await prisma.yourModel.create({
//       data: {
//         // Map validated data to your model
//         ...data,
//         createdBy: userId,
//       },
//     });

//     // Return successful response
//     return successResponse(result, 201);
//   } catch (error) {
//     logger.api.error("POST", request.url, error);
//     return handleApiError(error);
//   }
// }
