import "@testing-library/jest-dom";
import { server } from "./__tests__/__mocks__/server";
import fetch from "node-fetch";
import { ReadableStream, TransformStream, WritableStream } from 'web-streams-polyfill';

// Establish API mocking before all tests.
beforeAll(() => server.listen());
// Reset any request handlers added during tests.
afterEach(() => server.resetHandlers());
// Clean up after the tests.
afterAll(() => server.close());

// Polyfill fetch and related globals, casting to bypass type mismatches.
if (!globalThis.fetch) {
  globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
  globalThis.Response = (fetch as any).Response;
  globalThis.Headers = (fetch as any).Headers;
  globalThis.Request = (fetch as any).Request;
}

if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = TransformStream as any;
  global.ReadableStream = ReadableStream as any;
  global.WritableStream = WritableStream as any;
}