export interface Candidate {
  name: string;
  photo: string;
  position: string;
  election: string;
  politicalAffiliation: string;
  bio: string;
  policies: string[];
  additionalNotes: string;
  website: string;
  linkedin: string;
  twitter: string;
  donationLink: string;
  verified: boolean;
  city: string;
  state: string;
  sources: string[];
}

export const zipCodeDictionary: { [key: string]: { city: string; state: string } } = {
  '13053': { city: 'Dryden', state: 'NY' },
  '14850': { city: 'Lansing', state: 'NY' },
};

export const cityStateToZip: { [key: string]: string[] } = {
  'Dryden, NY': ['13053'],
  'Lansing, NY': ['14850'],
};