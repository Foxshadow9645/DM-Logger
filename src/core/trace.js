export function traceID(prefix = "OPS-DR") {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${t}-${r}`;
}
