interface TemplateBlock {
  order: number;
  type: "HEADING" | "TEXT" | "IMAGE" | "LIST";
  level?: number;
  text?: string;
  color?: "GRAY";
  body?: string;
  imageUrl?: string;
  listStyle?: "BULLET";
  items?: string[];
}

export const elevraStarterTemplate: Array<TemplateBlock> = [
  /* ───────────────────  MAIN HEADLINE  ────────────── */
  {
    order: 0,
    type: "HEADING",
    level: 1,
    text: "I’m Johnny Appleseed & I’m running for the Hackensack Board of Education.",
    color: "GRAY",
  },

  /* ───────────────  INTRO PARAGRAPHS  ─────────────── */
  {
    order: 1,
    type: "TEXT",
    body: `I was raised right here in Hackensack - walking these same halls, learning from exceptional teachers, and building friendships that shaped the person I am today.

Now, as I raise my own child in this community, I’m committed to helping ensure our schools remain strong for every student: safe, supportive, and inclusive for the next generation.

That’s why I’m running for the Board of Education on **November 4th 2025**`,
    color: "GRAY",
  },

  /* optional portrait  */
  {
    order: 2,
    type: "IMAGE",
    imageUrl: "/example-johnny.jpg",
  },

  /* ────────────────  WHAT I BRING  ────────────────── */
  {
    order: 3,
    type: "HEADING",
    level: 2,
    text: "What I Bring",
    color: "GRAY",
  },
  {
    order: 4,
    type: "LIST",
    listStyle: "BULLET",
    items: [
      "I bring commitment. Hackensack has been my home for decades, and I’ve built my life here - as a student walking these same hallways, as a parent raising my child here, and as Senior Editor at the Hackensack Daily News covering the stories that shape our community. I understand that our schools are more than classrooms - they’re a cornerstone of our city’s identity.",
      "I bring a passion for fairness. Every student deserves the chance to thrive in an environment where they feel safe, respected, and supported. That means looking closely at the challenges they face and making sure our policies turn our shared values into action.",
      "I bring curiosity and courage. I believe in asking thoughtful questions, seeking real answers, and not backing away from difficult topics. Honest dialogue is how we find solutions that work for everyone.",
      "I bring proven leadership. In my career, I’ve led teams through tight deadlines, complex projects, and tough decisions. I know how to listen, prioritize, and collaborate to reach goals that serve the greater good.",
      "I bring perspective. I see our schools through two lenses - my own years as a student here and my experiences as a parent today. That dual view helps me appreciate our progress while keeping my eyes on what still needs to be done.",
    ],
    color: "GRAY",
  },

  /* ────────────────  WHAT I BELIEVE  ──────────────── */
  {
    order: 5,
    type: "HEADING",
    level: 2,
    text: "What I Believe",
    color: "GRAY",
  },
  {
    order: 6,
    type: "LIST",
    listStyle: "BULLET",
    items: [
      "I believe our schools should reflect the very best of Hackensack - championing every student, honoring diverse perspectives, and opening doors so all children can reach their potential.",
      "I believe we have a responsibility to stand with our most vulnerable students and make sure every child has the tools, support, and opportunities they need to succeed, no matter their background, learning style, or personal challenges.",
      "I believe in hearing from all voices, not just the loudest. Our strength comes from listening to students, families, educators, and neighbors with a range of experiences and perspectives.",
      "I believe in facing tough questions head-on and making decisions with clarity and integrity - being transparent about trade-offs and grounded in shared values.",
      "I believe public education is one of our greatest investments - not only for today’s students but for the future health, prosperity, and unity of our community.",
    ],
    color: "GRAY",
  },

  /* ────────────────  WHY I’M RUNNING  ─────────────── */
  {
    order: 7,
    type: "HEADING",
    level: 2,
    text: "Why I’m Running",
    color: "GRAY",
  },
  {
    order: 8,
    type: "TEXT",
    body: `The heart of Hackensack has always been its people. My connection to this city didn’t begin with this campaign - it began as a kid walking the halls of our public schools, learning from the dedicated teachers who helped shape who I am.

I’m committed to strengthening that connection and doing everything I can to support our students, families, and schools. I’m ready to work collaboratively with fellow board members and our administration to make Hackensack’s schools - and our community - the very best they can be.`,
    color: "GRAY",
  },
  /* ────────────────  Picture/video  ─────────────── */
  {
    order: 9,
    type: "IMAGE",
    imageUrl: "/johnny-lawnsign.png",
  },
];

export const simpleTemplate: Array<TemplateBlock> = [
  /* ───────────────────  MAIN HEADLINE  ────────────── */
  {
    order: 0,
    type: "HEADING",
    level: 1,
    text: "I’m Johnny Appleseed & I’m running for the Hackensack Board of Education.",
    color: "GRAY",
  },

  /* ────────────────  IMAGE  ─────────────── */
  {
    order: 1,
    type: "IMAGE",
    imageUrl: "/example-johnny.jpg",
  },

  /* ────────────────  INTRO TEXT  ─────────────── */
  {
    order: 2,
    type: "TEXT",
    body: `I was raised right here in Hackensack - walking these same halls, learning from exceptional teachers, and building friendships that shaped the person I am today.

Now, as I raise my own child in this community, I’m committed to helping ensure our schools remain strong for every student: safe, supportive, and inclusive for the next generation.

That’s why I’m running for the Board of Education on **November 4th 2025**`,
    color: "GRAY",
  },
];
