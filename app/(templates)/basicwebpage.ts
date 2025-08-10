import { BlockType, ListStyle, TextColor, Prisma } from "@prisma/client";

export const davidWeinsteinTemplate = [
  /* ───────────────────  MAIN HEADLINE  ────────────── */
  {
    order: 0,
    type: BlockType.HEADING,
    level: 1,
    text: "I’m David Weinstein & I’m running for the Hastings Board of Education.",
    color: TextColor.BLACK,
  },

  /* ───────────────  INTRO PARAGRAPHS  ─────────────── */
  {
    order: 1,
    type: BlockType.TEXT,
    body: `I grew up in Hastings. From Hillside to FMS to HHS, I walked these halls, learned from incredible teachers, and built relationships that shaped who I am today.

Now, I’m raising my own child here, and I want to help make sure our schools remain strong for all learners: safe, supportive, and inclusive for the next generation.

That’s why I’m running for the Board of Education on **May 20th 2025**.`,
    color: TextColor.GRAY,
  },

  /* optional portrait  */
  {
    order: 2,
    type: BlockType.IMAGE,
    imageUrl: "/david1.webp",
  },

  /* ────────────────  WHAT I BRING  ────────────────── */
  {
    order: 3,
    type: BlockType.HEADING,
    level: 2,
    text: "What I Bring",
    color: TextColor.BLACK,
  },
  {
    order: 4,
    type: BlockType.LIST,
    listStyle: ListStyle.BULLET,
    items: [
      "I bring a strong sense of responsibility to this community. I’m a volunteer firefighter here in Hastings, and service has always been central to how I show up. Our schools are not just for students and their families. They are part of the fabric of our entire community. I want to bring my entire Hastings self to this role: as a parent, a longtime resident and native, a first responder, and Hastings’ #1 Fan.",
      "I bring a deep belief in equity. I believe all students deserve to feel safe, supported, and seen. That means understanding all the factors that impact a student’s growth, and building systems that reflect our values, not just our intentions.",
      "I bring curiosity. I ask a lot of questions and I don’t shy away from hard conversations. I believe that’s how progress happens: when we confront challenges directly and work through them together.",
      "I bring leadership experience. I’ve spent the majority of my career as a Head of Production in media and advertising, managing complex teams, tight timelines, and competing priorities. My job is to listen, to organize, to lead, and to find solutions that reflect the needs of everyone involved.",
      "I bring perspective. I know what it’s like to be a student in this district, and now I’m experiencing it as a parent. That dual lens helps me understand where we’ve come from and informs me on where we need to go.",
    ],
    color: TextColor.BLACK,
  },

  /* ────────────────  WHAT I BELIEVE  ──────────────── */
  {
    order: 5,
    type: BlockType.HEADING,
    level: 2,
    text: "What I Believe",
    color: TextColor.BLACK,
  },
  {
    order: 6,
    type: BlockType.LIST,
    listStyle: ListStyle.BULLET,
    items: [
      "I believe in a school system that reflects the best of who we are—one that supports every student, celebrates diverse perspectives, and creates opportunities for all kids to thrive.",
      "I believe in protecting the most vulnerable among us and making sure every student has what they need to succeed, regardless of their background, how they learn, or what challenges they may be facing.",
      "I believe in listening to all voices, not just the loudest. We grow stronger when we hear from students, parents, educators, and neighbors with different perspectives and lived experiences.",
      "I believe in asking hard questions and making thoughtful decisions. I believe in being honest about trade-offs and clear about values.",
      "I believe that public education is one of the most important things we can invest in—not just for today’s students but for the future of our entire community.",
    ],
    color: TextColor.BLACK,
  },

  /* ────────────────  WHY I’M RUNNING  ─────────────── */
  {
    order: 7,
    type: BlockType.HEADING,
    level: 2,
    text: "Why I’m Running",
    color: TextColor.BLACK,
  },
  {
    order: 8,
    type: BlockType.TEXT,
    body: `The heart of Hastings has always been its people. My connection to this village didn’t begin with this campaign, but rather started as a kid at Hillside, learning from the incredible teachers who shaped who I am.   

I’m looking forward to strengthening my connection to this village and doing everything I can to support our citizens and institutions. I’m ready to focus on working with existing board members and the administration to make our schools and our community the best it can be.`,
    color: TextColor.BLACK,
  },
  /* ────────────────  Picture/video  ─────────────── */
  {
    order: 9,
    type: BlockType.IMAGE,
    imageUrl: "/DAVID_LAWN_SIGN.webp",
  },
] satisfies Array<
  // anything that matches Prisma’s create input,
  // *except* the FK columns we fill in later
  Omit<Prisma.ContentBlockUncheckedCreateInput, "candidateId" | "electionId">
>;
