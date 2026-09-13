export function normalizeForTTS(text, entries) {
  let out = String(text);
  const pairs = Object.entries(entries).sort((a, b) => b[0].length - a[0].length);
  for (const [surface, reading] of pairs) {
    out = out.split(surface).join(reading);
  }
  return out;
}
