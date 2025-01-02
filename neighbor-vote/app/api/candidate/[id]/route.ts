import { NextResponse } from 'next/server';
import prisma from '../../../../prisma/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const candidateId = parseInt(id, 10);

    

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate data:', error);
    return NextResponse.json({ error: 'Failed to fetch candidate data' }, { status: 500 });
  }
}
