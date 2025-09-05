export type AdminNotificationRow = { label: string; value: string };

export type AdminNotificationParams = {
  title: string;
  intro?: string;
  rows?: AdminNotificationRow[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

export function renderAdminNotification({
  title,
  intro,
  rows = [],
  ctaLabel,
  ctaUrl,
  footerNote = "This is an automated message from Elevra Community.",
}: AdminNotificationParams) {
  const rowsHtml = rows
    .map(
      (r) => `
        <tr>
          <td style="padding:8px 12px;border:1px solid #eee;background:#fafafa;width:180px;font-weight:600;">${
            r.label
          }</td>
          <td style="padding:8px 12px;border:1px solid #eee;">${
            r.value
          }</td>
        </tr>`
    )
    .join("");

  const ctaHtml =
    ctaLabel && ctaUrl
      ? `<p style="margin:22px 0 0 0;">
           <a href="${ctaUrl}" style="display:inline-block;background:#6d28d9;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:600;">${ctaLabel}</a>
         </p>`
      : "";

  return `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,\"Helvetica Neue\",Arial,\"Noto Sans\",\"Apple Color Emoji\",\"Segoe UI Emoji\";padding:24px;max-width:640px;">
    <h2 style="color:#6d28d9;margin:0 0 12px 0;">${title}</h2>
    ${intro ? `<p style=\"margin:0 0 16px 0;\">${intro}</p>` : ""}
    ${rows.length ? `<table cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;width:100%;margin:12px 0;\">${rowsHtml}</table>` : ""}
    ${ctaHtml}
    <hr style="border:1px solid #eee;margin:24px 0;" />
    <p style="color:#64748b;font-size:12px;margin:0;">${footerNote}</p>
  </div>`;
}

