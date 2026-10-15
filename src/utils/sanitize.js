// ===== SANITIZACIÓN DE ENTRADA =====
// Ported from legacy booking-app.js. The escaped value is what gets sent to the backend
// (data compatibility with records created by the old app).

// Escapes HTML-significant characters. Identical output to the legacy `sanitizeInput`.
export function sanitizeInput(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Reverses exactly the five entities produced by `sanitizeInput`, for display in React
// (legacy admin rendered the stored escaped values through innerHTML, which decoded them).
// `&amp;` MUST be decoded last, otherwise `&amp;lt;` would collapse into `<` instead of `&lt;`.
export function decodeEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
}
