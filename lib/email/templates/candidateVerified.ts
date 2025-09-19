const EMAIL_FONT =
  'font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Helvetica Neue",Arial,"Noto Sans","Apple Color Emoji","Segoe UI Emoji"';

export const CANDIDATE_VERIFIED_SUBJECT = "You're Verified on Elevra!";

export type CandidateVerificationEmailParams = {
  firstName?: string;
  dashboardUrl: string;
  profileUrl?: string;
  supportEmail?: string;
};

export function renderCandidateVerificationEmail({
  firstName,
  dashboardUrl,
  profileUrl,
  supportEmail = "elevracommunity@gmail.com",
}: CandidateVerificationEmailParams): { subject: string; html: string } {
  const greetingName = (firstName || "").trim() || "there";
  const sections = [
    {
      title: "Edit your candidate profile",
      body: "Make sure it stays up-to-date and compelling for voters.",
    },
    {
      title: "Enjoy your verified badge",
      body: "Verified candidates see a boost in their profile visibility.",
    },
    {
      title: "Share your profile",
      body: "Invite supporters to view your page and grow engagement.",
    },
  ];

  const sectionItems = sections
    .map(
      (s) => `
        <li style="margin-bottom:12px;">
          <strong>${s.title}</strong> ${s.body}
        </li>`
    )
    .join("");

  const profileLink = profileUrl
    ? `<p style="margin:0 0 16px 0;font-size:15px;">🔗 View your public profile: <a href="${profileUrl}" style="color:#6d28d9;text-decoration:underline;">${profileUrl}</a></p>`
    : "";

  const html = `
  <div style="${EMAIL_FONT};padding:32px;background:#f8fafc;">
    <table role="presentation" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
      <tr>
        <td style="text-align:center;">
          <div style="font-size:46px;line-height:1;margin-bottom:12px;">&#127881;</div>
          <h1 style="margin:0;font-size:26px;color:#0f172a;">You're Verified on Elevra!</h1>
          <p style="margin:12px 0 20px 0;font-size:16px;color:#475569;">
            Hi ${greetingName}, your candidate profile is live and discoverable to voters. Welcome aboard!
          </p>
        </td>
      </tr>
      <tr>
        <td style="font-size:15px;color:#334155;line-height:1.6;">
          <p style="margin:0 0 16px 0;">
            Here are a few quick wins to help you make the most of Elevra:
          </p>
          <ul style="padding-left:20px;margin:0 0 20px 0;list-style:square;color:#334155;">
            ${sectionItems}
          </ul>
          ${profileLink}
          <p style="margin:0 0 16px 0;font-size:15px;">
            You're ready to engage with voters on Elevra. Let us know which features matter most to you at
            <a href="mailto:${supportEmail}" style="color:#6d28d9;text-decoration:underline;">${supportEmail}</a>.
          </p>
          <p style="margin:0 0 24px 0;font-size:15px;">
            Heads up: We'd love your feedback--reply to this email anytime with ideas or questions. We're building Elevra for candidates like you, and your input helps shape the platform.
          </p>
          <div style="text-align:center;margin:28px 0 12px 0;">
            <a href="${dashboardUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:16px;">Go to Candidate Dashboard</a>
          </div>
        </td>
      </tr>
      <tr>
        <td style="text-align:center;font-size:12px;color:#94a3b8;margin-top:16px;">
          <p style="margin:12px 0 0 0;">Built with care by the Elevra team.</p>
        </td>
      </tr>
    </table>
  </div>`;

  return { subject: CANDIDATE_VERIFIED_SUBJECT, html };
}
