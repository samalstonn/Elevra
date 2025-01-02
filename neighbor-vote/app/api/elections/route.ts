import { NextResponse } from 'next/server';
import prisma from '../../../prisma/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get('zipCode') || '';

  const elections = await prisma.election.findMany({
    where: { zipcode: zipCode},
    include: { candidates: true },
  });

  const mappedElections = elections.map((election) => ({
    electionID: election.id,
    position: election.position,
    candidate_number: election.candidates.length.toString(),
    candidates: election.candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      party: candidate.party,
    })),
  }));

  return NextResponse.json(mappedElections);
}
