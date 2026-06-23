/**
 * Builds an Open Library cover URL for a given ISBN.
 *
 * ?default=false makes Open Library return a real 404 when it has no
 * cover for an ISBN, instead of a 1x1 blank pixel served with a 200 OK
 * (their documented default behavior) — which would silently defeat the
 * <img onError> fallback in BookCover.jsx. See the Slice 18 build notes
 * for the full story; this is the one place that fix lives so every
 * caller gets it automatically.
 */
export function coverUrl(isbn, size = 'L') {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg?default=false`
}
