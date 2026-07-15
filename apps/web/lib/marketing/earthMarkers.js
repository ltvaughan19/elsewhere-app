/**
 * Destination pins locked to the Spline Earth.
 *
 * Uses HTML overlays projected from globe math (lat/lng + earth spin + camera).
 * Spline ships its own Three.js — injecting a second `three` instance into
 * `app._scene` often produces invisible meshes. This approach is reliable and
 * never touches Earth materials / textures / UVs / lighting.
 *
 * Kill switch: NEXT_PUBLIC_EARTH_MARKERS=0
 */

export const EARTH_MARKERS_ENABLED =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_EARTH_MARKERS !== "0";

export const DESTINATIONS = [
  { id: "ph", name: "Philippines", lat: 12.8797, lng: 121.774, short: "PH" },
  { id: "th", name: "Thailand", lat: 15.87, lng: 100.9925, short: "TH" },
  { id: "mx", name: "Mexico", lat: 23.6345, lng: -102.5528, short: "MX" },
];

/** Tune if pins sit in wrong ocean. */
export const MARKER_CALIBRATION = {
  lngOffsetDeg: -10,
  latOffsetDeg: 0,
  radiusScale: 1.02,
};

export function latLngToSpherePosition(lat, lng, radius, calib = MARKER_CALIBRATION) {
  const latRad = ((lat + (calib.latOffsetDeg || 0)) * Math.PI) / 180;
  const lngRad = ((lng + (calib.lngOffsetDeg || 0)) * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  return {
    x: radius * cosLat * Math.sin(lngRad),
    y: radius * Math.sin(latRad),
    z: radius * cosLat * Math.cos(lngRad),
  };
}

function rotateY(p, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: p.x * c + p.z * s,
    y: p.y,
    z: -p.x * s + p.z * c,
  };
}

function length(v) {
  return Math.hypot(v.x, v.y, v.z) || 1;
}

function normalize(v) {
  const L = length(v);
  return { x: v.x / L, y: v.y / L, z: v.z / L };
}

function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Project world point to canvas CSS pixels using cam + look-at.
 * Approximates Spline framing (FOV ~42°).
 */
function projectToCanvas(world, cam, look, canvasW, canvasH) {
  const forward = normalize(sub(look, cam));
  let right = cross(forward, { x: 0, y: 1, z: 0 });
  if (length(right) < 1e-5) right = cross(forward, { x: 1, y: 0, z: 0 });
  right = normalize(right);
  const up = normalize(cross(right, forward));

  const to = sub(world, cam);
  const z = dot(to, forward);
  if (z <= 1) return null;

  const x = dot(to, right);
  const y = dot(to, up);
  const fov = 42 * (Math.PI / 180);
  const f = 0.5 / Math.tan(fov / 2);
  const aspect = canvasW / Math.max(1, canvasH);

  const ndcX = (x * f) / (z * aspect);
  const ndcY = (y * f) / z;

  return {
    x: (ndcX + 1) * 0.5 * canvasW,
    y: (1 - (ndcY + 1) * 0.5) * canvasH,
    depth: z,
  };
}

function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("elsewhere-earth-marker-css")) return;
  const style = document.createElement("style");
  style.id = "elsewhere-earth-marker-css";
  style.textContent = `
    .ea-earth-markers {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 4;
      overflow: hidden;
    }
    .ea-pin {
      position: absolute;
      transform: translate(-50%, -50%);
      will-change: transform, opacity;
    }
    .ea-pin-core {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #f4efdf 0%, #c8b48a 45%, #7a6a45 100%);
      box-shadow:
        0 0 0 1px rgba(244, 241, 234, 0.35),
        0 0 14px rgba(200, 180, 138, 0.75),
        0 0 28px rgba(126, 184, 201, 0.35);
    }
    .ea-pin-ring {
      position: absolute;
      inset: -8px;
      border-radius: 50%;
      border: 1px solid rgba(126, 184, 201, 0.55);
      opacity: 0.7;
      animation: ea-pin-pulse 2.4s ease-out infinite;
    }
    .ea-pin-label {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      padding: 3px 8px;
      border-radius: 999px;
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(244, 241, 234, 0.92);
      background: rgba(7, 9, 13, 0.55);
      border: 1px solid rgba(244, 241, 234, 0.14);
      backdrop-filter: blur(8px);
      white-space: nowrap;
    }
    @keyframes ea-pin-pulse {
      0% { transform: scale(0.85); opacity: 0.75; }
      70% { transform: scale(1.55); opacity: 0; }
      100% { transform: scale(1.55); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .ea-pin-ring { animation: none; opacity: 0.35; }
    }
  `;
  document.head.appendChild(style);
}

/**
 * @param {object} opts
 * @param {HTMLCanvasElement} opts.canvas
 * @param {() => object} opts.getPose - splineScene getPose()
 * @param {boolean} opts.reducedMotion
 */
export async function createEarthMarkers({
  canvas,
  getPose,
  reducedMotion = false,
}) {
  if (!EARTH_MARKERS_ENABLED || !canvas || typeof document === "undefined") {
    return { update() {}, dispose() {} };
  }

  ensureStyles();

  const parent = canvas.parentElement || canvas;
  const prev = parent.style.position;
  if (!prev || prev === "static") parent.style.position = "relative";

  const root = document.createElement("div");
  root.className = "ea-earth-markers";
  root.setAttribute("aria-hidden", "true");
  parent.appendChild(root);

  /** @type {Array<{ el: HTMLElement, dest: typeof DESTINATIONS[0] }>} */
  const pins = DESTINATIONS.map((dest) => {
    const el = document.createElement("div");
    el.className = "ea-pin";
    el.dataset.id = dest.id;
    el.innerHTML = `
      <span class="ea-pin-ring"></span>
      <span class="ea-pin-core"></span>
      <span class="ea-pin-label">${dest.short}</span>
    `;
    if (reducedMotion) {
      const ring = el.querySelector(".ea-pin-ring");
      if (ring) ring.style.animation = "none";
    }
    root.appendChild(el);
    return { el, dest };
  });

  console.info(
    "[Elsewhere] Earth markers (DOM overlay):",
    DESTINATIONS.map((d) => d.id).join(", "),
  );

  let disposed = false;

  function update() {
    if (disposed) return;
    const pose = getPose?.();
    if (!pose?.ready || !pose.cam || !pose.look) {
      for (const p of pins) p.el.style.opacity = "0";
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const w = rect.width || canvas.clientWidth || 1;
    const h = rect.height || canvas.clientHeight || 1;
    const radius =
      (pose.earthRadius || 150) * (MARKER_CALIBRATION.radiusScale || 1.02);
    const spin = pose.earthSpinRad || 0;
    const cam = pose.cam;
    const look = pose.look;
    const camDir = normalize(sub(cam, look));

    for (const { el, dest } of pins) {
      const local = latLngToSpherePosition(dest.lat, dest.lng, radius);
      const world = rotateY(local, spin);
      const outward = normalize(world);
      // Facing: pin normal vs vector from center toward camera
      const toCam = normalize(cam);
      const facing = Math.max(
        0,
        Math.min(1, (dot(outward, toCam) - 0.02) / 0.6),
      );

      const projected = projectToCanvas(world, cam, look, w, h);
      if (!projected || facing < 0.05) {
        el.style.opacity = "0";
        el.style.visibility = "hidden";
        continue;
      }

      el.style.visibility = "visible";
      el.style.opacity = String(0.25 + facing * 0.75);
      el.style.left = `${projected.x}px`;
      el.style.top = `${projected.y}px`;
      el.style.zIndex = String(Math.round(1000 - projected.depth));
    }
  }

  function dispose() {
    disposed = true;
    try {
      root.remove();
    } catch {
      /* ignore */
    }
    if (prev === "" || prev === "static") {
      /* leave relative — safe for marketing host */
    }
  }

  // Kick once so first paint isn’t empty
  update();

  return { update, dispose };
}
