import type { ChangeEventType } from "@prisma/client";

const PURPLE = "#5b21b6";
const TEXT = "#1f2937";

type Shared = {
  manageUrl: string;
};

export function renderCandidateFollowerEmail({
  candidateName,
  followerName,
  manageUrl,
  appUrl,
}: {
  candidateName: string;
  followerName: string;
  appUrl: string;
} & Shared) {
  const subject = `${followerName} just followed your Elevra profile`;
  const html = wrapEmail(`
    <h1 style="color:${PURPLE};font-size:22px;margin:0 0 12px;">You have a new follower!</h1>
    <p style="margin:0 0 24px;color:${TEXT};">
      <strong>${sanitize(followerName)}</strong> wants to stay in the loop with ${sanitize(
        candidateName
      )}'s campaign updates on Elevra.
    </p>
    ${primaryButton(`${appUrl}/candidates/candidate-dashboard`, "Open your dashboard")}
    ${secondaryManage(manageUrl)}
  `);
  return { subject, html };
}

export function renderVoterUpdateEmail({
  voterName,
  candidateName,
  summary,
  candidateUrl,
  manageUrl,
  updateType,
}: {
  voterName?: string;
  candidateName: string;
  summary: string;
  candidateUrl: string;
  updateType: ChangeEventType;
} & Shared) {
  const readable = formatType(updateType);
  const subject = `${candidateName} posted a new ${readable.toLowerCase()}`;
  const html = wrapEmail(`
    <h1 style="color:${PURPLE};font-size:22px;margin:0 0 12px;">${sanitize(
      candidateName
    )} has news</h1>
    <p style="margin:0 0 16px;color:${TEXT};">
      ${voterName ? `Hi ${sanitize(voterName)}, ` : ""}here&apos;s the latest ${
    readable.toLowerCase()
  } update:
    </p>
    <blockquote style="border-left:4px solid ${PURPLE};padding-left:14px;margin:0 0 24px;color:${TEXT};font-style:italic;">
      ${sanitize(summary)}
    </blockquote>
    ${primaryButton(candidateUrl, "View candidate profile")}
    ${secondaryManage(manageUrl)}
  `);
  return { subject, html };
}

export function renderDailyDigestEmail({
  voterName,
  manageUrl,
  appUrl,
  items,
}: {
  voterName?: string;
  items: Array<{
    candidateName: string;
    summary: string;
    updateType: ChangeEventType;
    occurredAt: Date | string;
    candidateUrl: string;
  }>;
} & Shared & { appUrl: string }) {
  const subject = "Your Elevra daily digest";
  const html = wrapEmail(`
    <h1 style="color:${PURPLE};font-size:22px;margin:0 0 12px;">
      ${voterName ? `Hi ${sanitize(voterName)},` : "Hello,"} here&apos;s what you missed today
    </h1>
    <ul style="list-style:disc;margin:0 0 24px 20px;padding:0;color:${TEXT};">
      ${
        items.length === 0
          ? "<li>No new updates in the last day.</li>"
          : items
              .map(
                (item) => `
                  <li style="margin-bottom:18px;">
                    <strong style="color:${PURPLE};">${sanitize(item.candidateName)}</strong>
                    <span style="display:block;font-size:12px;color:#6b7280;margin-top:2px;">
                      ${formatType(item.updateType)} • ${formatDate(item.occurredAt)}
                    </span>
                    <div style="margin-top:8px;">${sanitize(item.summary)}</div>
                    <a href="${item.candidateUrl}" style="display:inline-block;margin-top:8px;color:${PURPLE};text-decoration:underline;">
                      View candidate
                    </a>
                  </li>
                `
              )
              .join("")
      }
    </ul>
    ${primaryButton(`${appUrl}/dashboard`, "Open your dashboard")}
    ${secondaryManage(manageUrl)}
  `);
  return { subject, html };
}

function wrapEmail(inner: string) {
  return `
    <html>
      <body style="margin:0;padding:32px;background:#f9fafb;font-family:Arial,sans-serif;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;padding:32px;">
          <tr>
            <td>${inner}</td>
          </tr>
        </table>
        <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:18px;">
          © ${new Date().getFullYear()} Elevra. All rights reserved.
        </p>
      </body>
    </html>
  `;
}

function primaryButton(href: string, label: string) {
  return `
    <p style="margin:0 0 24px;">
      <a href="${href}" style="display:inline-block;background:${PURPLE};color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;">
        ${label}
      </a>
    </p>
  `;
}

function secondaryManage(href: string) {
  return `
    <p style="margin:32px 0 0;font-size:12px;color:#6b7280;">
      Manage notifications: <a href="${href}" style="color:${PURPLE};">Notification preferences</a>
    </p>
  `;
}

function sanitize(value: string) {
  return value.replace(/[<>]/g, "");
}

function formatType(type: ChangeEventType) {
  switch (type) {
    case "BIO":
      return "Bio update";
    case "EDUCATION":
      return "Education update";
    case "PHOTO":
      return "Photo update";
    case "CAMPAIGN":
      return "Campaign update";
    default:
      return "Campaign update";
  }
}

function formatDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
  });
}
