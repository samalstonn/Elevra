// __tests__/__mocks__/next-auth.ts
import { jest } from '@jest/globals';

jest.mock("next-auth/react", () => ({
    useSession: jest.fn(() => ({
      data: { user: { name: "Test User", email: "test@example.com" } },
      status: "authenticated",
    })),
    signIn: jest.fn(),
    signOut: jest.fn(),
  }));