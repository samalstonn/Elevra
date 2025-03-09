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
}

export const candidates = [
  {
    name: "Jason Leifer",
    photo: "", // Photo URL unknown; search online later
    position: "Incumbent Town Supervisor",
    election: "Town Supervisor (Dryden Town)",
    politicalAffiliation: "Democrat",
    bio: "Jason Leifer is the incumbent Town Supervisor, a local attorney who has led projects like Dryden Fiber. First elected in 2015, he focuses on broadband expansion and renewable energy initiatives.",
    policies: [
      "Expanding high-speed broadband",
      "Supporting sustainable development",
      "Maintaining strong town services"
    ],
    additionalNotes: "Running unopposed per party filings.",
    website: "",
    linkedin: "",
    twitter: "",
    donationLink: "",
    verified: false,
  },
  {
    name: "Dan Lamb",
    photo: "", // Photo URL unknown; search online later
    position: "Incumbent Town Board Councilmember",
    election: "Town Board – Councilmember (Dryden Town)",
    politicalAffiliation: "Democrat",
    bio: "Dan Lamb is an incumbent Town Board member and Deputy Supervisor with extensive experience, including 15 years as a congressional aide and teaching at Cornell’s Brooks School.",
    policies: [
      "Affordable housing",
      "Municipal broadband expansion",
      "Environmental stewardship",
      "Smart growth"
    ],
    additionalNotes: "Declared intention to run for re-election; no formal opposition announced.",
    website: "dlamb@dryden.ny.us",
    linkedin: "",
    twitter: "",
    donationLink: "",
    verified: true,
  },
  {
    name: "Leonardo Vargas-Méndez",
    photo: "", // Photo URL unknown; search online later
    position: "Incumbent Town Board Councilmember",
    election: "Town Board – Councilmember (Dryden Town)",
    politicalAffiliation: "Democrat",
    bio: "Leonardo Vargas-Méndez is an incumbent Town Board member and Conservation Board Chair, with a background as a retired Cornell administrator and expertise in community planning.",
    policies: [
      "Green initiatives",
      "Expanding recreational trails",
      "Supporting agriculture",
      "Inclusive governance"
    ],
    additionalNotes: "Running for re-election.",
    website: "lvargas-mendez@dryden.ny.us",
    linkedin: "",
    twitter: "",
    donationLink: "",
    verified: false,
  },
  {
    name: "Peter Walsh",
    photo: "", // Photo URL unknown; search online later
    position: "Incumbent Town Justice",
    election: "Town Justice (Dryden Town Court)",
    politicalAffiliation: "Republican",
    bio: "Peter Walsh is an incumbent Town Justice, serving since 2019 with a focus on efficient case management and alternative sentencing for low-level offenses.",
    policies: [
      "Efficient case management",
      "Alternative sentencing for low-level offenses"
    ],
    additionalNotes: "Filed for re-election; cross-endorsed by major parties.",
    website: "",
    linkedin: "",
    twitter: "",
    donationLink: "",
    verified: false,
  },
  {
    name: "Rick Young",
    photo: "", // Photo URL unknown; search online later
    position: "Incumbent Highway Superintendent",
    election: "Highway Superintendent (Dryden Town)",
    politicalAffiliation: "Republican",
    bio: "Rick Young is the incumbent Highway/DPW Superintendent, overseeing road maintenance and public works with decades of experience in Dryden.",
    policies: [
      "Continuing improvement of town roads",
      "Efficient public works management"
    ],
    additionalNotes: "Filed for re-election; expected to appear on multiple ballot lines.",
    website: "",
    linkedin: "",
    twitter: "",
    donationLink: "",
    verified: false,
  },
  {
    name: "Dan Wakeman",
    photo: "", // Photo URL unknown; search online later
    position: "Democratic Candidate",
    election: "County Legislator – District 14",
    politicalAffiliation: "Democrat",
    bio: "Dan Wakeman is a longtime public servant and Village Trustee from Dryden, running for County Legislator for the redrawn district that includes Dryden.",
    policies: [
      "Rural broadband expansion",
      "Improving rural roads",
      "Affordable housing",
      "Public safety services"
    ],
    additionalNotes: "Running for an open seat; endorsed by the Dryden Democratic Committee.",
    website: "",
    linkedin: "",
    twitter: "",
    donationLink: "",
    verified: false,
  },
  {
    name: "Gregory Mezey",
    photo: "", // Photo URL unknown; search online later
    position: "Incumbent County Legislator",
    election: "County Legislator – District 13",
    politicalAffiliation: "Democrat",
    bio: "Gregory Mezey is the incumbent County Legislator for District 13, known for his work on affordable housing, smart land use, and economic development as the Legislature Vice-Chair.",
    policies: [
      "Affordable housing development",
      "Smart land use",
      "Expanding economic opportunities",
      "Green energy and environmental protection"
    ],
    additionalNotes: "Running for re-election; endorsed by local Democrats.",
    website: "Campaign Facebook 'Re-elect Greg Mezey'",
    linkedin: "",
    twitter: "",
    donationLink: "",
    verified: false,
  },
  {
    name: "Lee Shurtleff",
    photo: "", // Photo URL unknown; search online later
    position: "Republican Incumbent County Legislator",
    election: "County Legislator – District 9",
    politicalAffiliation: "Republican",
    bio: "Lee Shurtleff is a veteran legislator serving as the incumbent County Legislator for District 9, focusing on public safety and infrastructure improvements in rural communities.",
    policies: [
      "Taxpayer frugality",
      "Public safety",
      "Infrastructure maintenance"
    ],
    additionalNotes: "Confirmed re-election bid; significant incumbency advantage.",
    website: "lshurtleff@tompkins-co.org",
    linkedin: "",
    twitter: "",
    donationLink: "",
    verified: false,
  },
  {
    name: "Michael J. Murphy",
    photo: "/mike-murphy.webp",
    position: "Incumbent Village Mayor",
    election: "Village Mayor (Dryden Village)",
    politicalAffiliation: "Democrat (also on the 'Protecting Dryden' line)",
    bio: "Michael J. Murphy has been the Mayor of Dryden Village since 2017 and previously served as a Village Trustee. Under his leadership, major grants for water/sewer upgrades and downtown redevelopment were secured.",
    policies: [
      "Infrastructure improvements",
      "Downtown revitalization",
      "Stable taxation",
      "NY Forward initiative"
    ],
    additionalNotes: "Endorsed across party lines; filed candidacy.",
    website: "",
    linkedin: "",
    twitter: "",
    donationLink: "",
    verified: false,
  },
  {
    name: "Thomas C. 'Tom' Corey",
    photo: "/default-profile.png",
    position: "Republican Challenger – Village Mayor",
    election: "Village Mayor (Dryden Village)",
    politicalAffiliation: "Republican",
    bio: "Thomas C. 'Tom' Corey is a local businessman, U.S. Army veteran, and member of the Village Zoning Board. He previously ran for Town Supervisor in 2023 and is now challenging for Village Mayor.",
    policies: [
      "Public safety improvements",
      "Fiscal conservatism",
      "Attracting small businesses"
    ],
    additionalNotes: "Nominated at Republican caucus; his second campaign in two years.",
    website: "",
    linkedin: "",
    twitter: "",
    donationLink: "",
    verified: false,
  },
  {
    name: "Jason L. Dickinson",
    photo: "", // Photo URL unknown; search online later
    position: "Incumbent Village Trustee",
    election: "Village Trustee (Dryden Village)",
    politicalAffiliation: "Democrat (also on the 'Protecting Dryden' line)",
    bio: "Jason L. Dickinson has served as a Village Trustee since 2021 and is a high school teacher focused on youth programs, park improvements, and downtown revitalization.",
    policies: [
      "Downtown business incentives",
      "Pedestrian safety",
      "Fiscal transparency"
    ],
    additionalNotes: "Unanimously renominated by Democrats; filed candidacy.",
    website: "",
    linkedin: "",
    twitter: "",
    donationLink: "",
    verified: false,
  },
  {
    name: "Allison 'Allie' Buck",
    photo: "", // Photo URL unknown; search online later
    position: "Appointed Candidate – Village Trustee",
    election: "Village Trustee (Dryden Village)",
    politicalAffiliation: "Democrat (also on the 'Protecting Dryden' line)",
    bio: "Allison 'Allie' Buck, a young professional and Cornell employee, was appointed to fill a board vacancy and is now running for her first full term as Village Trustee.",
    policies: [
      "Family-friendly initiatives",
      "Environmental sustainability",
      "Community engagement"
    ],
    additionalNotes: "Nominated at Dem caucus; filed candidacy.",
    website: "",
    linkedin: "",
    twitter: "",
    donationLink: "",
    verified: false,
  },
  {
    name: "David S. Bravo-Cullen",
    photo: "", // Photo URL unknown; search online later
    position: "Republican Challenger – Village Trustee",
    election: "Village Trustee (Dryden Village)",
    politicalAffiliation: "Republican",
    bio: "David S. Bravo-Cullen is a Dryden native and contractor making his first run for office after serving as an alternate on the village Planning Board.",
    policies: [
      "Improving basic village services",
      "Fiscal responsibility",
      "Infrastructure maintenance"
    ],
    additionalNotes: "Filed via Republican caucus; aligned with Corey's platform.",
    website: "",
    linkedin: "",
    twitter: "",
    donationLink: "",
    verified: false,
  },
  {
    name: "Trevor Cross",
    photo: "/trevor-cross.jpeg",
    position: "Independent/Democratic Challenger – Housing Advocate",
    election: "Village Mayor (Dryden Village)",
    politicalAffiliation: "Independent, Democrat-leaning",
    bio: "Trevor Cross is a Cornell postdoctoral researcher and housing advocate, passionate about affordable housing and community development. Though he originally sought the Democratic nomination, he ran independently after Murphy was selected.",
    policies: [
      "Affordable Housing: Wants to expand housing options and lower costs.",
      "Walkability & Sustainability: Supports pedestrian-friendly development.",
      "Community Engagement: Advocates for fresh perspectives in local government."
    ],
    additionalNotes: "",
    website: "https://cals.cornell.edu/trevor-cross",
    linkedin: "https://www.linkedin.com/in/trevor-cross-73897695/",
    twitter: "",
    donationLink: "",
    verified: false,
}
];