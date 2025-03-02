// __tests__/mocks/authServiceMock.ts
export const loginService = jest.fn(async (credentials: { email: string; password: string }) => {
    // Simulate successful login for specific credentials
    if (credentials.email === "test@example.com" && credentials.password === "password") {
      return {
        user: { id: "1", name: "Test User", email: "test@example.com" },
        token: "fake-jwt-token",
      };
    }
    // Simulate failed login
    throw new Error("Invalid credentials");
  });