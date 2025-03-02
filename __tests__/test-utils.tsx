// __tests__/test-utils.tsx
import { render } from "@testing-library/react";
import { ReactElement } from "react";
import { AuthProvider } from "../app/lib/auth-context"; // Adjust path if needed

const customRender = (ui: ReactElement, options = {}) =>
  render(ui, { wrapper: AuthProvider, ...options });

export * from "@testing-library/react";
export { customRender as render };