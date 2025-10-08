export type AssistantSource = {
  id: string;
  title: string;
  url: string;
  summary: string;
  topics: string[];
  jurisdiction: "WA";
  county?: string;
};

export const WA_ASSISTANT_SOURCES: AssistantSource[] = [
  {
    id: "wa-sos-filing",
    title: "Washington Secretary of State – Candidate Filing",
    url: "https://www.sos.wa.gov/elections/candidatefiling",
    summary:
      "Explains how to file for office in Washington, including online filing hours (Monday 8 a.m. to Friday 5 p.m. during the second full week of May), filing fees, signature in lieu requirements, withdrawals by the Monday following filing week, and where to find the annual candidate filing calendar.",
    topics: ["filing", "deadlines", "signatures", "fees"],
    jurisdiction: "WA",
  },
  {
    id: "wa-sos-calendar",
    title: "County Election Calendar Contacts",
    url: "https://www.sos.wa.gov/elections/calendar-counties",
    summary:
      "Directory of county election officials with links to each county's election calendar, drop box locations, candidate pamphlet guidance, and contact information for local filing questions.",
    topics: ["county", "contacts", "deadlines"],
    jurisdiction: "WA",
  },
  {
    id: "wa-sos-pamphlet",
    title: "Washington State Voters' Pamphlet Information",
    url: "https://www.sos.wa.gov/elections/candidatefiling/online/voters-pamphlet",
    summary:
      "Outlines statewide voters' pamphlet submission rules: 200-word statement limit for local races unless county specifies otherwise, photo requirements (300 dpi, head-and-shoulders), optional contact info lines, and submission deadlines tied to filing week.",
    topics: ["pamphlet", "communications"],
    jurisdiction: "WA",
  },
  {
    id: "pdc-registration",
    title: "Public Disclosure Commission – Candidate Registration",
    url: "https://www.pdc.wa.gov/registration/candidates",
    summary:
      "Details campaign finance registration obligations: file a C-1 Candidate Registration within two weeks of becoming a candidate, open a campaign bank account before accepting contributions, file C-1pc if forming a committee, and keep records for public inspection.",
    topics: ["finance", "registration", "compliance"],
    jurisdiction: "WA",
  },
  {
    id: "pdc-reporting",
    title: "PDC – Reporting Options and Deadlines",
    url: "https://www.pdc.wa.gov/learn/compliance/candidate-filing-mini-reporting",
    summary:
      "Explains Washington campaign reporting: Mini Reporting available if raising and spending $5,000 or less with no contributors over $500; otherwise file full reports (C-3 deposits, C-4 summary) on the 10th of each month and weekly before elections. Highlights sponsor ID and advertising rules.",
    topics: ["finance", "reporting", "advertising"],
    jurisdiction: "WA",
  },
  {
    id: "rcw-29a-24-050",
    title: "RCW 29A.24.050 – Filing Period",
    url: "https://app.leg.wa.gov/rcw/default.aspx?cite=29A.24.050",
    summary:
      "Statute setting the regular candidate filing period: begins the Monday two weeks before Memorial Day and ends the following Friday at 5 p.m.; outlines three-day special filing period when no candidate filed, and authorizes filing online, by mail, or in person.",
    topics: ["filing", "law", "deadlines"],
    jurisdiction: "WA",
  },
  {
    id: "mrsc-signs",
    title: "MRSC – Political Sign Regulations in Washington",
    url: "https://mrsc.org/explore-topics/governance/elections/political-sign-regulations",
    summary:
      "Summarizes typical city and county political sign ordinances in Washington, including time limits, size restrictions, and removal requirements. Advises campaigns to check local municipal codes for definitive rules and permitting.",
    topics: ["signs", "outreach"],
    jurisdiction: "WA",
  },
  {
    id: "wa-sos-special-districts",
    title: "SOS – Special Purpose District Candidate Guide",
    url: "https://www.sos.wa.gov/elections/candidatefiling/special-purpose-districts",
    summary:
      "Covers filing requirements for fire, school, port, and other special purpose districts, including qualifying residency, declaration of candidacy content, and signature alternatives when filing fees are not required.",
    topics: ["districts", "eligibility", "filing"],
    jurisdiction: "WA",
  },
];
