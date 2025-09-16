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

export type VerifiedCandidateTemplateExample = { name: string; url: string };

export type VerifiedCandidateTemplateUpdateParams = {
  candidateFirstName?: string; // fallback "there"
  templatesUrl: string; // link to template/builder flow
  profileUrl?: string; // optional profile link
  subject?: string; // override subject
  ctaLabel?: string; // override CTA label (default: "Create My Webpage")
  examples?: VerifiedCandidateTemplateExample[]; // optional example pages to showcase
};

export function renderVerifiedCandidateTemplateUpdate({
  candidateFirstName = "there",
  templatesUrl,
  profileUrl,
  subject = "Update: Templates are back — create your candidate webpage",
  ctaLabel = "Create My Webpage",
  examples = [
    {
      name: "John Fluet",
      url: "https://www.elevracommunity.com/candidate/john-fluet",
    },
    {
      name: "Amanda Stylianou",
      url: "https://www.elevracommunity.com/candidate/amanda-stylianou",
    },
  ],
}: VerifiedCandidateTemplateUpdateParams) {
  const name = (candidateFirstName || "").trim() || "there";

  const examplesHtml =
    examples.length > 0
      ? `
        <p style="margin:0 0 8px 0;line-height:1.55;">Want to see what it looks like? Here are a couple awesome examples from candidates near you:</p>
        <ul style="margin:0 0 16px 20px;padding:0;line-height:1.55;">
          ${examples
            .map(
              (e) =>
                `<li><a href="${e.url}" style="color:#6d28d9;text-decoration:underline;">${e.name}</a></li>`
            )
            .join("")}
        </ul>`
      : "";

  const profileBlurb = `Once published, your page will be discoverable under the <strong>School Board Tab</strong> on your Elevra profile${
    profileUrl
      ? ` (<a href="${profileUrl}" style="color:#6d28d9;text-decoration:underline;">view profile</a>)`
      : ""
  }.`;

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,\\"Helvetica Neue\\",Arial,\\"Noto Sans\\",\\"Apple Color Emoji\\",\\"Segoe UI Emoji\\";padding:24px;max-width:640px;">
      <p style="margin:0 0 16px 0;">Hi ${name},</p>
      <p style="margin:0 0 16px 0;line-height:1.55;">
        Due to a surge in new signups, our Templates feature didn’t work as expected.
      </p>
      <p style="margin:0 0 16px 0;line-height:1.55;">
        You can once again create a modern, effective candidate webpage for voters in just a few minutes. ${profileBlurb}
      </p>
      ${examplesHtml}
      <p style="margin:0 20px 20px 0;">
        <a href="${templatesUrl}" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#6d28d9;color:#fff;text-decoration:none;font-weight:600;">
          ${ctaLabel}
        </a>
      </p>
      <p style="margin:0 0 16px 0;line-height:1.55;color:#6b7280;font-size:13px;">
        Prefer a direct link? Copy and paste: <br/>
        <a href="${templatesUrl}" style="color:#6d28d9;text-decoration:underline;">${templatesUrl}</a>
      </p>
      <p style="margin:0 0 20px 0;line-height:1.55;">
        Best,<br/>
        Adam Rose<br/>
        Elevra | Cornell ’25<br/>
        <a href="https://www.linkedin.com/in/adamtherose/" style="color:#6d28d9;text-decoration:underline;">LinkedIn</a>
      </p>
    </div>`;

  return { subject, html };
}
