/**
 * Destination pins locked to the Spline Earth (DOM overlay).
 *
 * Important: Earth radius must match the Spline mesh. An undersized radius
 * piles every pin near the visual center of the globe (the bug we hit).
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

/**
 * Texture / meridian calibration for this Spline globe.
 * If pins sit in ocean after radius is right, nudge lngOffsetDeg (±5–20).
 */
export const MARKER_CALIBRATION = {
  lngOffsetDeg: 0,
  latOffsetDeg: 0,
  /** Lift slightly above surface. */
  radiusScale: 1.02,
  /**
   * Must match earth mesh rotation.y direction.
   * +1 = same as splineScene earthSpin; -1 only if pins drift opposite land.
   */
  spinSign: 1,
  flipY: false,
};

export function latLngToSpherePosition(lat, lng, radius, calib = MARKER_CALIBRATION) {
  const latRad = ((lat + (calib.latOffsetDeg || 0)) * Math.PI) / 180;
  const lngRad = ((lng + (calib.lngOffsetDeg || 0)) * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  // Standard geo on Y-up sphere: +X = 90°E, +Z = 0° (prime meridian)
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

function projectToCanvas(world, cam, look, canvasW, canvasH, fovDeg, flipY = false) {
  const forward = normalize(sub(look, cam));
  let right = cross(forward, { x: 0, y: 1, z: 0 });
  if (length(right) < 1e-5) right = cross(forward, { x: 1, y: 0, z: 0 });
  right = normalize(right);
  const up = normalize(cross(right, forward));

  const to = sub(world, cam);
  const z = dot(to, forward);
  if (z <= 2) return null;

  const x = dot(to, right);
  const y = dot(to, up);
  const fov = (fovDeg || 45) * (Math.PI / 180);
  const f = 0.5 / Math.tan(fov / 2);
  const aspect = canvasW / Math.max(1, canvasH);

  let ndcX = (x * f) / (z * aspect);
  let ndcY = (y * f) / z;
  if (flipY) ndcY = -ndcY;

  return {
    x: (ndcX + 1) * 0.5 * canvasW,
    y: (1 - ndcY) * 0.5 * canvasH,
    depth: z,
  };
}

function ensureStyles() {
  if (typeof document === "undefined") return;
  const existing = document.getElementById("elsewhere-earth-marker-css");
  if (existing) existing.remove();
  const style = document.createElement("style");
  style.id = "elsewhere-earth-marker-css";
  style.textContent = `
    .ea-earth-markers {
      position: fixed;
      pointer-events: none;
      z-index: 4;
      overflow: visible;
    }
    .ea-pin {
      position: absolute;
      width: 18px;
      height: 18px;
      transform: translate(-50%, -50%);
      will-change: transform, opacity, left, top;
      transition: opacity 160ms ease;
    }
    .ea-pin-core {
      position: absolute;
      inset: 4px;
      border-radius: 50%;
      background:
        radial-gradient(circle at 32% 28%, #fff6e4 0%, #c8b48a 42%, #8a7548 100%);
      box-shadow:
        0 0 0 1px rgba(244, 241, 234, 0.45),
        0 0 10px rgba(200, 180, 138, 0.9),
        0 0 22px rgba(126, 184, 201, 0.45);
    }
    .ea-pin-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 1.5px solid rgba(126, 184, 201, 0.65);
      box-shadow: 0 0 12px rgba(126, 184, 201, 0.35);
      animation: ea-pin-pulse 2.6s ease-out infinite;
    }
    .ea-pin-label {
      position: absolute;
      left: 22px;
      top: 50%;
      transform: translateY(-50%);
      padding: 4px 9px;
      border-radius: 999px;
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(244, 241, 234, 0.95);
      background: rgba(7, 9, 13, 0.55);
      border: 1px solid rgba(200, 180, 138, 0.28);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      white-space: nowrap;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
    }
    @keyframes ea-pin-pulse {
      0% { transform: scale(0.75); opacity: 0.8; }
      70% { transform: scale(1.7); opacity: 0; }
      100% { transform: scale(1.7); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .ea-pin-ring { animation: none; opacity: 0.4; }
    }
  `;
  document.head.appendChild(style);
}

function radiusFromObject(obj) {
  try {
    const mesh = obj?._mesh || obj?.mesh || obj;
    const geo = mesh?.geometry;
    if (geo) {
      if (!geo.boundingSphere) geo.computeBoundingSphere?.();
      const r = geo.boundingSphere?.radius;
      const sx = Math.abs(mesh.scale?.x ?? obj.scale?.x ?? 1);
      const sy = Math.abs(mesh.scale?.y ?? obj.scale?.y ?? 1);
      const sz = Math.abs(mesh.scale?.z ?? obj.scale?.z ?? 1);
      const s = Math.max(sx, sy, sz) || 1;
      if (r && Number.isFinite(r) && r > 1) return r * s;
    }
    // Spline SPEObjects sometimes expose size / scale as proxy
    const sx = Math.abs(obj?.scale?.x ?? 0);
    const sy = Math.abs(obj?.scale?.y ?? 0);
    const sz = Math.abs(obj?.scale?.z ?? 0);
    const proxy = Math.max(sx, sy, sz);
    if (proxy > 10) return proxy * 0.5;
  } catch {
    /* fall through */
  }
  return 0;
}

/**
 * Pick the largest plausible Earth radius among spin targets / scene meshes.
 * Fallback ~1/3 of camera distance (this scene's framing).
 */
export function measureEarthRadius(earthObj, camPos, extras = []) {
  let best = 0;
  const candidates = [earthObj, ...(extras || [])].filter(Boolean);
  for (const obj of candidates) {
    const r = radiusFromObject(obj);
    if (r > best) best = r;
  }

  // Walk Three scene for largest globe-like mesh if SPEObject had no geometry
  try {
    const roots = [];
    for (const obj of candidates) {
      if (obj?._scene) roots.push(obj._scene);
      if (obj?.parent) roots.push(obj.parent);
    }
    for (const root of roots) {
      const stack = [root];
      let guard = 0;
      while (stack.length && guard++ < 400) {
        const node = stack.pop();
        if (!node) continue;
        if (node.isMesh || node.isSkinnedMesh) {
          const name = String(node.name || "");
          if (/earth|globe|planet|sphere|world|ocean|land/i.test(name) || !name) {
            try {
              if (!node.geometry?.boundingSphere) {
                node.geometry?.computeBoundingSphere?.();
              }
              let r = node.geometry?.boundingSphere?.radius || 0;
              node.updateWorldMatrix?.(true, false);
              const sx = node.getWorldScale?.({ x: 1, y: 1, z: 1 }) || {
                x: node.scale?.x || 1,
                y: node.scale?.y || 1,
                z: node.scale?.z || 1,
              };
              r *= Math.max(Math.abs(sx.x), Math.abs(sx.y), Math.abs(sx.z)) || 1;
              if (r > best && r < 50000) best = r;
            } catch {
              /* skip */
            }
          }
        }
        if (node.children?.length) {
          for (const c of node.children) stack.push(c);
        }
      }
    }
  } catch {
    /* ignore */
  }

  if (best > 1) return best;

  const dist =
    Math.hypot(camPos?.x ?? 0, camPos?.y ?? 0, camPos?.z ?? 1000) || 1000;
  // Hero framing: globe fills a large share of the view — not ~15% of cam dist
  return dist * 0.34;
}

/**
 * @param {object} opts
 * @param {HTMLCanvasElement} opts.canvas
 * @param {() => object} opts.getPose
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

  const root = document.createElement("div");
  root.className = "ea-earth-markers";
  root.setAttribute("aria-hidden", "true");
  document.body.appendChild(root);

  const pins = DESTINATIONS.map((dest) => {
    const el = document.createElement("div");
    el.className = "ea-pin";
    el.dataset.id = dest.id;
    el.title = dest.name;
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
    "[Elsewhere] Earth markers ready:",
    DESTINATIONS.map((d) => d.id).join(", "),
  );

  let disposed = false;

  function layoutRoot() {
    const rect = canvas.getBoundingClientRect();
    root.style.left = `${rect.left}px`;
    root.style.top = `${rect.top}px`;
    root.style.width = `${rect.width}px`;
    root.style.height = `${rect.height}px`;
    return rect;
  }

  function update() {
    if (disposed) return;
    const pose = getPose?.();
    const rect = layoutRoot();
    if (!pose?.ready || !pose.cam || !pose.look || !pose.earthRadius) {
      for (const p of pins) {
        p.el.style.opacity = "0";
        p.el.style.visibility = "hidden";
      }
      return;
    }

    const w = rect.width || canvas.clientWidth || 1;
    const h = rect.height || canvas.clientHeight || 1;
    const radius = pose.earthRadius * (MARKER_CALIBRATION.radiusScale || 1.02);
    const spin =
      (pose.earthSpinRad || 0) * (MARKER_CALIBRATION.spinSign ?? 1);
    const cam = pose.cam;
    const look = pose.look;
    const center = pose.earthCenter || { x: 0, y: 0, z: 0 };
    const fovDeg = pose.fovDeg || 45;

    for (const { el, dest } of pins) {
      const local = latLngToSpherePosition(dest.lat, dest.lng, radius);
      const worldLocal = rotateY(local, spin);
      const world = {
        x: worldLocal.x + center.x,
        y: worldLocal.y + center.y,
        z: worldLocal.z + center.z,
      };

      const outward = normalize(sub(world, center));
      const toCam = normalize(sub(cam, center));
      const facing = dot(outward, toCam);

      // Far side: hard hide
      if (facing < 0.18) {
        el.style.opacity = "0";
        el.style.visibility = "hidden";
        continue;
      }

      const projected = projectToCanvas(
        world,
        cam,
        look,
        w,
        h,
        fovDeg,
        MARKER_CALIBRATION.flipY,
      );
      if (!projected) {
        el.style.opacity = "0";
        el.style.visibility = "hidden";
        continue;
      }

      if (
        projected.x < -48 ||
        projected.y < -48 ||
        projected.x > w + 48 ||
        projected.y > h + 48
      ) {
        el.style.opacity = "0";
        el.style.visibility = "hidden";
        continue;
      }

      const edge = Math.min(1, (facing - 0.18) / 0.5);
      el.style.visibility = "visible";
      el.style.opacity = String(0.4 + edge * 0.6);
      el.style.left = `${projected.x}px`;
      el.style.top = `${projected.y}px`;
      el.style.zIndex = String(Math.round(2000 - projected.depth));
    }
  }

  function dispose() {
    disposed = true;
    try {
      root.remove();
    } catch {
      /* ignore */
    }
  }

  update();
  return { update, dispose };
}
