import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma"; 

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await the params object before accessing its properties
    const resolvedParams = await params;
    const electionId = parseInt(resolvedParams.id);
    
    // Get the election by ID
    const election = await prisma.election.findUnique({
      where: {
        id: electionId
      }
    });
    
    if (!election) {
      return NextResponse.json(
        { message: 'Election not found' },
        { status: 404 }
      );
    }
    
    // Return the election data including city and state
    return NextResponse.json({
      id: election.id,
      city: election.city,
      state: election.state,
    });
  } catch (error) {
    console.error('Error fetching election:', error);
    return NextResponse.json(
      { message: 'Error fetching election data' },
      { status: 500 }
    );
  }
}