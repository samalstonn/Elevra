// __tests__/setup.ts
import "@testing-library/jest-dom/extend-expect";
import { beforeAll, jest } from '@jest/globals';

// Mock Next.js router to prevent errors when testing components that use useRouter
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/",
  }),
}));

// Mock console.error to avoid unnecessary warnings in test output
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((message) => {
    if (
      typeof message === "string" &&
      (message.includes("React has been loaded before") || message.includes("Warning:"))
    ) {
      return;
    }
    console.error(message);
  });
});