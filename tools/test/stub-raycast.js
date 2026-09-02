// Minimal @raycast/api stand-in so the pure logic modules can run under plain node.
const handler = { get: (_t, prop) => String(prop) };
export const Color = new Proxy({}, handler);
export const Icon = new Proxy({}, handler);
