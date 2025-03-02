import { http } from 'msw';

export const handlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const { email, password } = await request.json() as { email: string, password: string };
    if (email === "test@example.com" && password === "password") {
      return new Response(JSON.stringify({
        user: { id: "1", name: "Test User", email: "test@example.com" },
        token: "fake-jwt-token",
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }
    return new Response(JSON.stringify({ error: "Invalid credentials" }), {
      headers: { "Content-Type": "application/json" },
      status: 401,
    });
  }),
];