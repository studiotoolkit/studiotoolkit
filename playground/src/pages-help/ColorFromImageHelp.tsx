import Header from "../components/Header";
import Footer from "../components/Footer";
import "./ColorFromImageHelp.css";

// ─── Icon helpers ────────────────────────────────────────────────────
const IconImage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);
const IconGear = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconCode = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);
const IconBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

export default function ColorFromImageHelp() {
  return (
    <div className="cfih-page">
      <Header />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="cfih-hero">
        <div className="cfih-hero-eyebrow">Technical Reference</div>
        <h1>ColorFromImage — Technical Writeup</h1>
        <p className="cfih-hero-subtitle">
          Extract a perceptually accurate color palette from any image, purely
          in the browser — with zero external dependencies.
        </p>
        <div className="cfih-meta-row">
          <div className="cfih-meta-badge">
            <span>Component</span>
            <span>ColorFromImage.tsx</span>
          </div>
          <div className="cfih-meta-badge">
            <span>Purpose</span>
            <span>Extract dominant palette from an image</span>
          </div>
          <div className="cfih-meta-badge">
            <span>Dependencies</span>
            <span>Zero external libraries</span>
          </div>
        </div>
      </div>

      <main className="cfih-main">

        {/* ── Overview ───────────────────────────────────────────── */}
        <section className="cfih-section">
          <h2 className="cfih-section-title">
            <IconImage /> Overview
          </h2>
          <div className="cfih-prose">
            <p>
              <code>ColorFromImage</code> is a self-contained React component that extracts a
              dominant color palette from an image purely in the browser. It accepts images via
              drag-and-drop, clipboard paste (<code>Ctrl+V</code>), a file prop, or a URL prop —
              and calls back with an ordered array of hex colors representing the image&apos;s palette.
            </p>
            <p>
              All color math is implemented from scratch using the <strong>OKLab perceptual color
              space</strong>, which means the palette reflects how humans actually see color, not
              just how pixels are numerically distributed.
            </p>
          </div>
        </section>

        {/* ── How It Works ───────────────────────────────────────── */}
        <section className="cfih-section">
          <h2 className="cfih-section-title">
            <IconGear /> How It Works — Step by Step
          </h2>

          {/* Step 1 */}
          <div className="cfih-step">
            <div className="cfih-step-header">
              <span className="cfih-step-num">1</span>
              <h3 className="cfih-step-title">Image Ingestion</h3>
            </div>
            <div className="cfih-step-body">
              <p>
                The component supports four input paths, all funneling into the same processing
                pipeline:
              </p>
              <div className="cfih-table-wrap">
                <table className="cfih-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Mechanism</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Drag and drop</td>
                      <td><code>onDrop</code> → reads file as <code>Blob</code></td>
                    </tr>
                    <tr>
                      <td>Clipboard paste</td>
                      <td><code>window</code> paste event → reads <code>ClipboardItem</code> as <code>Blob</code></td>
                    </tr>
                    <tr>
                      <td><code>imageFile</code> prop</td>
                      <td><code>File</code> object → reads as <code>Blob</code></td>
                    </tr>
                    <tr>
                      <td><code>imageUrl</code> prop</td>
                      <td><code>Image</code> with <code>crossOrigin=&quot;anonymous&quot;</code> → falls back to display-only if CORS blocks pixel access</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                For <code>Blob</code>-based inputs, a <code>FileReader</code> converts the file to
                a data URL, which is then loaded into an <code>HTMLImageElement</code>. This
                guarantees same-origin access to pixel data — bypassing the CORS restriction that
                blocks <code>getImageData()</code> on cross-origin images loaded directly.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="cfih-step">
            <div className="cfih-step-header">
              <span className="cfih-step-num">2</span>
              <h3 className="cfih-step-title">Pixel Data Extraction</h3>
            </div>
            <div className="cfih-step-body">
              <p>
                Once the image is loaded, it is drawn onto an off-screen <code>&lt;canvas&gt;</code>{" "}
                at its native resolution. <code>ctx.getImageData()</code> returns a flat{" "}
                <code>Uint8ClampedArray</code> of RGBA values — four bytes per pixel.
              </p>
              <pre className="cfih-code-block">[R, G, B, A, R, G, B, A, ...]</pre>
              <p>
                Transparent pixels (<code>A &lt; 128</code>) are skipped entirely, so PNG
                transparency is handled correctly.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="cfih-step">
            <div className="cfih-step-header">
              <span className="cfih-step-num">3</span>
              <h3 className="cfih-step-title">Color Space Conversion — sRGB → OKLab</h3>
            </div>
            <div className="cfih-step-body">
              <p>
                Every sampled pixel is converted from sRGB to <strong>OKLab</strong> before any
                clustering is done.
              </p>
              <p>
                OKLab is a perceptually uniform color space designed by Björn Ottosson (2020).
                In OKLab:
              </p>
              <ul>
                <li>
                  <strong>Equal Euclidean distance = equal perceived color difference.</strong> This
                  is not true in RGB, where a step of 10 in blue looks very different from a step
                  of 10 in green.
                </li>
                <li>
                  <strong>Hue is stable</strong> across lightness and chroma changes — a quality
                  absent from both HSL and standard CIELAB.
                </li>
              </ul>
              <p>The conversion pipeline is:</p>
              <pre className="cfih-code-block">sRGB → linearize (gamma removal) → cone-response matrix → cube-root → OKLab matrix</pre>
              <p>
                All coefficients are embedded directly from the OKLab specification. No external
                library is needed.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="cfih-step">
            <div className="cfih-step-header">
              <span className="cfih-step-num">4</span>
              <h3 className="cfih-step-title">Saturation-Weighted Sampling</h3>
            </div>
            <div className="cfih-step-body">
              <p>
                Rather than feeding every pixel into the clustering algorithm, the component samples
                pixels with a <strong>chroma-based inclusion probability</strong>:
              </p>
              <div className="cfih-table-wrap">
                <table className="cfih-table">
                  <thead>
                    <tr>
                      <th>OKLab Chroma</th>
                      <th>Inclusion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>&lt; 0.05 (near-grey)</td>
                      <td>20%</td>
                    </tr>
                    <tr>
                      <td>0.05 – 0.15 (moderate)</td>
                      <td>60%</td>
                    </tr>
                    <tr>
                      <td>≥ 0.15 (vivid)</td>
                      <td>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>This is the key fix that separates this implementation from naive k-means on images.</p>
              <div className="cfih-callout">
                <strong>Why it matters:</strong> In a photograph of a bird against a green forest,
                the background might account for 90% of all pixels. A uniform sampler would fill
                the palette almost entirely with shades of green. By up-weighting vivid pixels,
                small but visually dominant regions — the bird&apos;s bright plumage, a saturated flower,
                a neon sign — get proportional representation and form their own cluster instead of
                being absorbed.
              </div>
              <p>
                A stride step (<code>step = max(1, floor(total_pixels / 4000))</code>) limits the
                working set to ~4,000 pixels for performance, applied before the chroma filter.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="cfih-step">
            <div className="cfih-step-header">
              <span className="cfih-step-num">5</span>
              <h3 className="cfih-step-title">K-Means++ Clustering in OKLab Space</h3>
            </div>
            <div className="cfih-step-body">
              <p>
                The filtered pixel set is clustered into <strong>k = 16</strong> groups using{" "}
                <strong>K-Means++</strong> initialization.
              </p>

              <p className="cfih-subhead">Why K-Means++?</p>
              <p>
                Standard k-means places initial centroids randomly, which can cause multiple
                centroids to start near the same cluster — leaving other parts of the color space
                uncovered. K-Means++ (Arthur &amp; Vassilvitskii, 2007) instead seeds each new
                centroid with probability proportional to its squared distance from the nearest
                existing centroid, spreading centroids across the color space from the start and
                dramatically reducing bad initializations.
              </p>

              <p className="cfih-subhead">Why k = 16?</p>
              <p>
                A larger k means more clusters compete for palette slots. With k = 16, a dominant
                neutral-tone background cannot consume all available palette entries — there are
                enough slots left for accent colors. The final output can be trimmed to any target
                size by the consuming component.
              </p>

              <p className="cfih-subhead">The Clustering Loop</p>
              <pre className="cfih-code-block">{`For each iteration (max 20):
  1. Assign each pixel to its nearest centroid (OKLab Euclidean distance)
  2. Recompute each centroid as the mean of its assigned pixels
  3. Stop early if no assignments changed`}</pre>
              <p>
                All distance math uses squared Euclidean distance in OKLab — squaring avoids a{" "}
                <code>sqrt()</code> call per comparison, which is valid since relative ordering is
                all that matters for nearest-neighbor assignment.
              </p>
            </div>
          </div>

          {/* Step 6 */}
          <div className="cfih-step">
            <div className="cfih-step-header">
              <span className="cfih-step-num">6</span>
              <h3 className="cfih-step-title">Chroma-Biased Output Sorting</h3>
            </div>
            <div className="cfih-step-body">
              <p>
                After clustering converges, results are sorted by a{" "}
                <strong>chroma-weighted score</strong> rather than raw pixel count:
              </p>
              <pre className="cfih-code-block">score = count × (1 + 3 × chroma)</pre>
              <p>
                A cluster of 500 vivid pixels (chroma = 0.20) scores{" "}
                <code>500 × (1 + 0.60) = 800</code> — higher than a neutral cluster of 700 pixels
                (chroma = 0.03) which scores <code>700 × (1 + 0.09) = 763</code>.
              </p>
              <p>
                This ensures the returned palette leads with the colors that define the image&apos;s
                visual character, not just the colors that cover the most area.
              </p>
            </div>
          </div>

          {/* Step 7 */}
          <div className="cfih-step">
            <div className="cfih-step-header">
              <span className="cfih-step-num">7</span>
              <h3 className="cfih-step-title">Canvas Rendering and State Management</h3>
            </div>
            <div className="cfih-step-body">
              <p>
                Separately from the extraction pipeline, the component maintains a visible{" "}
                <code>&lt;canvas&gt;</code> that mirrors the loaded image, letterboxed to fit the
                configured <code>width × height</code>. This is handled via{" "}
                <code>useLayoutEffect</code> refs — keeping <code>drawToCanvas</code> and{" "}
                <code>onColorsExtracted</code> stable across renders without requiring them as{" "}
                <code>useEffect</code> dependencies, which avoids stale-closure bugs.
              </p>
            </div>
          </div>
        </section>

        {/* ── Comparison ─────────────────────────────────────────── */}
        <section className="cfih-section">
          <h2 className="cfih-section-title">
            <IconStar /> What Makes It Better Than Naive Approaches
          </h2>

          <p className="cfih-subhead" style={{ marginTop: 0 }}>vs. Simple RGB k-means</p>
          <div className="cfih-table-wrap">
            <table className="cfih-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Naive RGB k-means</th>
                  <th>This implementation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Color space</strong></td>
                  <td>RGB (perceptually non-uniform)</td>
                  <td className="cfih-table-check">OKLab (perceptually uniform)</td>
                </tr>
                <tr>
                  <td><strong>Sampling</strong></td>
                  <td>Uniform</td>
                  <td className="cfih-table-check">Chroma-weighted</td>
                </tr>
                <tr>
                  <td><strong>Initialization</strong></td>
                  <td>Random</td>
                  <td className="cfih-table-check">K-Means++</td>
                </tr>
                <tr>
                  <td><strong>k value</strong></td>
                  <td>Typically 8</td>
                  <td className="cfih-table-check">16 (more clusters, fewer collisions)</td>
                </tr>
                <tr>
                  <td><strong>Output sort</strong></td>
                  <td>By pixel count</td>
                  <td className="cfih-table-check">By chroma-biased score</td>
                </tr>
                <tr>
                  <td><strong>Vivid accent colors</strong></td>
                  <td>Frequently lost</td>
                  <td className="cfih-table-check">Preserved by up-weighting</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="cfih-compare-grid">
            <div className="cfih-compare-card">
              <p className="cfih-compare-card-title">vs. HSL Histogram Methods</p>
              <p>
                Methods like Google&apos;s dominant-color API find the peak of a hue histogram. They
                return at most one color and are blind to secondary hues. This implementation
                returns a full ranked palette — typically 10–16 usable colors covering the image&apos;s
                full chromatic range.
              </p>
            </div>
            <div className="cfih-compare-card">
              <p className="cfih-compare-card-title">vs. Median Cut (Heckbert 1979)</p>
              <p>
                Median Cut recursively bisects bounding boxes. It is fast and deterministic, but
                ignores color distribution within each box — a bucket with one vivid pixel and 999
                grey pixels will split the grey range, discarding the vivid color entirely. This
                component&apos;s chroma-weighted sampling directly solves that problem.
              </p>
            </div>
            <div className="cfih-compare-card">
              <p className="cfih-compare-card-title">CORS Handling</p>
              <p>
                The two-stage URL loading (attempt <code>crossOrigin=&quot;anonymous&quot;</code> first, fall
                back to display-only with error message) means the component never silently fails.
                The user is told exactly why extraction failed and what to do about it (upload the
                file directly), rather than returning an empty palette with no explanation.
              </p>
            </div>
          </div>
        </section>

        {/* ── Component API ──────────────────────────────────────── */}
        <section className="cfih-section">
          <h2 className="cfih-section-title">
            <IconCode /> Component API
          </h2>
          <pre className="cfih-code-block">{`<ColorFromImage
  width={400}                          // Canvas display width (px)
  height={300}                         // Canvas display height (px)
  borderColor="#cccccc"                // Drop zone border color
  borderThickness={1}                  // Border width (px)
  onColorsExtracted={(entry) => {}}    // Callback: { palette: string[] }
  imageUrl="https://..."               // Optional URL to load on mount
  imageFile={file}                     // Optional File object to load
  clearTrigger={n}                     // Increment to clear the canvas
/>`}</pre>
          <div className="cfih-table-wrap" style={{ marginTop: 16 }}>
            <table className="cfih-table">
              <thead>
                <tr>
                  <th>Prop</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="cfih-api-prop">width</span></td>
                  <td><span className="cfih-api-type">number</span></td>
                  <td>Canvas display width in pixels</td>
                </tr>
                <tr>
                  <td><span className="cfih-api-prop">height</span></td>
                  <td><span className="cfih-api-type">number</span></td>
                  <td>Canvas display height in pixels</td>
                </tr>
                <tr>
                  <td><span className="cfih-api-prop">borderColor</span></td>
                  <td><span className="cfih-api-type">string</span></td>
                  <td>Drop zone border color (CSS color value)</td>
                </tr>
                <tr>
                  <td><span className="cfih-api-prop">borderThickness</span></td>
                  <td><span className="cfih-api-type">number</span></td>
                  <td>Border width in pixels</td>
                </tr>
                <tr>
                  <td><span className="cfih-api-prop">onColorsExtracted</span></td>
                  <td><span className="cfih-api-type">(entry: {`{ palette: string[] }`}) =&gt; void</span></td>
                  <td>Callback fired after extraction. <code>palette[0]</code> is the most visually dominant color.</td>
                </tr>
                <tr>
                  <td><span className="cfih-api-prop">imageUrl</span></td>
                  <td><span className="cfih-api-type">string</span></td>
                  <td>Optional URL to load and analyze on mount</td>
                </tr>
                <tr>
                  <td><span className="cfih-api-prop">imageFile</span></td>
                  <td><span className="cfih-api-type">File</span></td>
                  <td>Optional <code>File</code> object to load and analyze on mount</td>
                </tr>
                <tr>
                  <td><span className="cfih-api-prop">clearTrigger</span></td>
                  <td><span className="cfih-api-type">number</span></td>
                  <td>Increment to programmatically clear the canvas</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="cfih-callout" style={{ marginTop: 16 }}>
            A typical 16-color palette from a photographic image will include neutrals, mid-tones,
            and vivid accents, all perceptually well-separated in OKLab space.
          </div>
        </section>

        {/* ── References ─────────────────────────────────────────── */}
        <section className="cfih-section">
          <h2 className="cfih-section-title">
            <IconBook /> References
          </h2>
          <ol className="cfih-refs">
            <li>
              <span className="cfih-ref-num">1</span>
              <span>
                Ottosson, B. (2020). <em>A perceptual color space for image processing.</em>{" "}
                oklab.org
              </span>
            </li>
            <li>
              <span className="cfih-ref-num">2</span>
              <span>
                Arthur, D. &amp; Vassilvitskii, S. (2007).{" "}
                <em>K-Means++: The advantages of careful seeding.</em> SODA &apos;07.
              </span>
            </li>
            <li>
              <span className="cfih-ref-num">3</span>
              <span>
                Heckbert, P.S. (1982).{" "}
                <em>Color image quantization for frame buffer display.</em> SIGGRAPH &apos;82.
              </span>
            </li>
            <li>
              <span className="cfih-ref-num">4</span>
              <span>
                Lloyd, S.P. (1982).{" "}
                <em>Least squares quantization in PCM.</em> IEEE Transactions on Information
                Theory 28(2).
              </span>
            </li>
          </ol>
        </section>

      </main>

      <Footer />
    </div>
  );
}
