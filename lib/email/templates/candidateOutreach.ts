export type CandidateOutreachParams = {
  candidateFirstName?: string; // Candidate's first name (fallback "there")
  electionName?: string; // Name of the election (e.g. "Spring 2025 Board of Education Election")
  state?: string; // Optional location context (e.g. "NJ")
  claimUrl: string; // URL for candidate to claim their profile
  contactName?: string; // Outreach sender name
  contactRole?: string; // Sender role / affiliation line 1
  contactSubline?: string; // Additional affiliation / tagline
  contactPhone?: string; // Phone number for signature
  extraParagraph?: string; // Optional additional paragraph content
  footerNote?: string; // Override default automated footer
  ctaLabel?: string; // Override default CTA label (default: "Claim My Profile")
};

export function renderCandidateOutreach({
  candidateFirstName = "there",
  state,
  claimUrl,
}: // contactName = "Sam Alston",
// contactRole = "Elevra",
// contactSubline = "Cornell ’25",
// contactPhone = "732-547-3519",
// ctaLabel = "Claim My Profile",
CandidateOutreachParams) {
  const greetingName = candidateFirstName.trim() || "there";
  const locationFragment = state ? `in ${state}` : "";

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,\\"Helvetica Neue\\",Arial,\\"Noto Sans\\",\\"Apple Color Emoji\\",\\"Segoe UI Emoji\\";padding:24px;max-width:640px;">
      <p style="margin:0 0 16px 0;">Hi ${greetingName},</p>
      <p style="margin:0 0 16px 0;line-height:1.55;">
        Your election is live on Elevra – a platform created by Cornell University students from New Jersey to make elections easier to run for candidates and easier to access for voters. Just click 
        <a href="${claimUrl}" style="color:#6d28d9;text-decoration:underline;">here</a> and hit “This is Me” to claim and customize your profile.
      </p>
      <p style="margin:0 0 16px 0;line-height:1.55;">
        Voters have been viewing and comparing candidates ${locationFragment} on our site and we would love for you to be part of the conversation.
      </p>
      <p style="margin:0 0 20px 0;line-height:1.55;">
        Best,<br/>
        Adam Rose<br/>
        Elevra | Cornell ’25
        <br/>
        <a href="https://www.linkedin.com/in/adamtherose/" style="color:#6d28d9;text-decoration:underline;">LinkedIn</a>
      </p>
    </div>`;

  return html;
}

export type CandidateOutreachFollowupParams = CandidateOutreachParams & {
  subject?: string; // Optional subject override (defaults to an "RE:" style)
  followupIntro?: string; // Optional custom intro paragraph for the follow-up
};

export function renderCandidateOutreachFollowup({
  candidateFirstName = "there",
  state,
  claimUrl,
  followupIntro,
  subject = "RE: Claim your Elevra profile",
}: CandidateOutreachFollowupParams) {
  const greetingName = candidateFirstName.trim() || "there";
  const locationFragment = state ? `in ${state}` : "";

  // Reuse the original outreach content so the thread looks like a real follow-up
  const originalHtml = renderCandidateOutreach({
    candidateFirstName,
    state,
    claimUrl,
  });

  const introHtml =
    followupIntro ??
    `Following up on the note below in case it got buried. Voters ${
      locationFragment ? ` ${locationFragment} ` : " "
    }have been viewing and comparing candidates on Elevra, and you can claim your profile <a href="${claimUrl}" style="color:#6d28d9;text-decoration:underline;">here</a>.`;

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,\\"Helvetica Neue\\",Arial,\\"Noto Sans\\",\\"Apple Color Emoji\\",\\"Segoe UI Emoji\\";padding:24px;max-width:640px;">
      <p style="margin:0 0 16px 0;">Hi ${greetingName},</p>
      <p style="margin:0 0 16px 0;line-height:1.55;">${introHtml}</p>
      <p style="margin:0 0 20px 0;line-height:1.55;">
        Best,<br/>
        Adam Rose<br/>
        Elevra | Cornell ’25
        <br/>
        <a href="https://www.linkedin.com/in/adamtherose/" style="color:#6d28d9;text-decoration:underline;">LinkedIn</a>
      </p>
      <p style="margin:0 0 8px 0;color:#6b7280;font-size:12px;">— Original message —</p>
      <div style="border-left:3px solid #e5e7eb;padding-left:16px;margin:0;opacity:0.95;">
        ${originalHtml}
      </div>
    </div>`;

  // Return both subject and html so the caller can set the email subject line to an "RE:" style
  return { subject, html };
}
