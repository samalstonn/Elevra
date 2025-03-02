// jest.polyfill.ts
import fetch from "node-fetch";
import { TextEncoder, TextDecoder } from "util";

// Polyfill fetch and related globals
if (!globalThis.fetch) {
  globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
  globalThis.Response = (fetch as any).Response;
  globalThis.Headers = (fetch as any).Headers;
  globalThis.Request = (fetch as any).Request;
}

// Polyfill TextEncoder and TextDecoder
globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder as any;