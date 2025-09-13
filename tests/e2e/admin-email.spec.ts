import { test, expect } from "@playwright/test";

test.describe("Admin email endpoints", () => {
  test("proxy forwards and returns success (dry-run)", async ({
    request,
    baseURL,
  }) => {
    const res = await request.post(`${baseURL}/api/admin/email-proxy`, {
      data: {
        subject: "Proxy Test from Playwright",
        data: { title: "Proxy OK", intro: "Hello from tests" },
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toMatchObject({ success: true });
  });

  test("direct route requires secret and succeeds with it (dry-run)", async ({
    request,
    baseURL,
  }) => {
    // Without secret should fail
    const bad = await request.post(`${baseURL}/api/admin/email`, {
      data: { subject: "Bad", data: { intro: "no secret" } },
    });
    expect([401, 403]).toContain(bad.status());

    // With secret should succeed
    const secret = process.env.ADMIN_EMAIL_SECRET || "local-dev-admin-secret";
    const ok = await request.post(`${baseURL}/api/admin/email`, {
      headers: { "x-admin-secret": secret, "Content-Type": "application/json" },
      data: {
        subject: "Direct OK from Playwright",
        data: { intro: "with secret" },
      },
    });
    expect(ok.ok()).toBeTruthy();
    const body = await ok.json();
    expect(body).toMatchObject({ success: true });
  });
});
