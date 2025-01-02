export type election_data = {
    electionID: string;
    position: string;
    candidate_number: string;
    candidates: { id: number; name: string; party: string }[];
  };