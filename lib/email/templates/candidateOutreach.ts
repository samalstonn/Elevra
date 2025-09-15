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
        <a href="${claimUrl}" style="color:#6d28d9;text-decoration:underline;">this link</a> and hit “This is Me” to claim and customize your profile.
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

export function renderCandidateOutreach1({
  candidateFirstName = "there",
  state,
  claimUrl,
  contactName = "Sam Alston",
  contactRole = "Elevra",
  contactSubline = "Cornell ’25",
  contactPhone = "732-547-3519",
  ctaLabel = "Claim My Profile",
}: CandidateOutreachParams) {
  const greetingName = candidateFirstName.trim() || "there";
  const locationFragment = state ? `in ${state}` : "";

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,\\"Helvetica Neue\\",Arial,\\"Noto Sans\\",\\"Apple Color Emoji\\",\\"Segoe UI Emoji\\";padding:24px;max-width:640px;">
        <p style="margin:0 0 16px 0;">Hi ${greetingName},</p>
        <p style="margin:0 0 16px 0;line-height:1.55;">Your election is now live on Elevra – a platform created by Cornell University students from New Jersey to make elections easier to run for candidates and easier to access for voters. Just click the button below to view your template profile and hit “This is Me” to claim and customize.</p>
        <p style="margin:0 0 16px 0;line-height:1.55;">Voters have already been viewing and comparing candidates ${locationFragment} on our site and we'd love for you to be part of the conversation. Reply to this email or reach out to me personally below with any feedback or insights you have - we're building Elevra for local candidates like you and truly want to hear what you have to say.</p>
        <p style="margin:24px 0 32px 0;">
			<a href="${claimUrl}" style="display:inline-block;background:#6d28d9;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600;font-size:14px;">${ctaLabel}</a>
		</p>
        <p style="margin:0 0 20px 0;line-height:1.55;">Best,<br/>
            ${contactName}<br/>
            ${contactRole}${contactSubline ? ` | ${contactSubline}` : ""}${
    contactPhone ? ` | ${contactPhone}` : ""
  }
        </p>
    </div>`;

  return html;
}
