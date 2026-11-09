/**
 * Face stylesheets, bundled into the JS so faces look right even when the
 * consumer doesn't import '@studiotoolkit/analog-clock/style.css'.
 * Built from the same src/faces/*.css files as style.css.
 */
const sheets = import.meta.glob("./faces/*.css", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const FACE_CSS = Object.keys(sheets)
  .sort()
  .map((file) => sheets[file])
  .join("\n");

export const FACE_STYLE_ID = "studiotoolkit-analog-clock-faces";

/**
 * Adds the face styles to <head> once. They go first in <head>, so the
 * app's own CSS (including style.css, if imported) still wins.
 */
export function injectFaceStyles(doc: Document = document): void {
  if (doc.getElementById(FACE_STYLE_ID)) return;
  const el = doc.createElement("style");
  el.id = FACE_STYLE_ID;
  el.textContent = FACE_CSS;
  doc.head.prepend(el);
}
