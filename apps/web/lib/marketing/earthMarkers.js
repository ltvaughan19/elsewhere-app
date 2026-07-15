/**
 * Destination pins on the Spline Earth — separate meshes only.
 * Does NOT touch Earth materials, textures, UVs, or lighting.
 *
 * Kill switch: set EARTH_MARKERS_ENABLED = false (or env NEXT_PUBLIC_EARTH_MARKERS=0)
 * Full revert: remove createEarthMarkers import from splineScene.js
 */

export const EARTH_MARKERS_ENABLED =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_EARTH_MARKERS !== "0";

/** Destinations currently supported in product. */
export const DESTINATIONS = [
  { id: "ph", name: "Philippines", lat: 12.8797, lng: 121.774 },
  { id: "th", name: "Thailand", lat: 15.87, lng: 100.9925 },
  { id: "mx", name: "Mexico", lat: 23.6345, lng: -102.5528 },
];

/**
 * Spline globe textures are rarely perfectly aligned to WGS84.
 * Tune these if pins sit in the wrong ocean (radians / degrees applied after latLng).
 */
export const MARKER_CALIBRATION = {
  /** Shift longitude so texture meridian matches our map (+east). */
  lngOffsetDeg: -10,
  /** Shift latitude (+north). */
  latOffsetDeg: 0,
  /** Surface offset multiplier — slight lift to avoid z-fight. */
  radiusScale: 1.012,
};

/**
 * Geographic → local sphere position (Y-up, +X east-ish after lng).
 * Common Three globe convention: lat=0 equator, lng=0 +Z or +X — we use:
 * x = cos(lat) * sin(lng)
 * y = sin(lat)
 * z = cos(lat) * cos(lng)
 */
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

function getThreeScene(app) {
  return (
    app?._scene ||
    app?.scene ||
    app?._renderer?.scene ||
    app?.renderer?.scene ||
    null
  );
}

function estimateRadius(earthObj, camPos) {
  try {
    const mesh = earthObj?._mesh || earthObj?.mesh;
    if (mesh?.geometry) {
      mesh.geometry.computeBoundingSphere?.();
      const r = mesh.geometry.boundingSphere?.radius;
      if (r && Number.isFinite(r) && r > 0) {
        const sx = Math.abs(mesh.scale?.x ?? earthObj.scale?.x ?? 1);
        return r * (sx || 1);
      }
    }
  } catch {
    /* fall through */
  }
  const dist = Math.hypot(camPos?.x ?? 0, camPos?.y ?? 0, camPos?.z ?? 1000) || 1000;
  return dist * 0.155;
}

/**
 * @param {object} opts
 * @param {import('@splinetool/runtime').Application} opts.app
 * @param {object|null} opts.earthRoot - primary spin target (Earth)
 * @param {object|null} opts.camera
 * @param {() => number} opts.getEarthSpinRad - current earth Y spin in radians
 * @param {boolean} opts.reducedMotion
 */
export async function createEarthMarkers({
  app,
  earthRoot,
  camera,
  getEarthSpinRad,
  reducedMotion = false,
}) {
  if (!EARTH_MARKERS_ENABLED) {
    return { update() {}, dispose() {} };
  }

  let THREE;
  try {
    THREE = await import("three");
  } catch (err) {
    console.warn("[Elsewhere] three unavailable — markers skipped", err);
    return { update() {}, dispose() {} };
  }

  const scene = getThreeScene(app);
  if (!scene || !earthRoot) {
    console.warn("[Elsewhere] Markers: no scene or earth root — skipped");
    return { update() {}, dispose() {} };
  }

  const camPos = camera?.position || { x: 0, y: 240, z: 1250 };
  const baseRadius = estimateRadius(earthRoot, camPos);
  const radius = baseRadius * (MARKER_CALIBRATION.radiusScale || 1.012);

  const group = new THREE.Group();
  group.name = "elsewhere-earth-markers";
  // Render after globe; avoid writing depth so no earth z-fight scars
  group.renderOrder = 10;
  scene.add(group);

  const accent = new THREE.Color("#c8b48a");
  const cool = new THREE.Color("#7eb8c9");

  /** @type {Array<{ core: any, ring: any, local: {x:number,y:number,z:number}, matCore: any, matRing: any }>} */
  const pins = [];

  for (const dest of DESTINATIONS) {
    const local = latLngToSpherePosition(dest.lat, dest.lng, radius);

    const coreGeo = new THREE.SphereGeometry(baseRadius * 0.012, 16, 16);
    const matCore = new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });
    const core = new THREE.Mesh(coreGeo, matCore);
    core.renderOrder = 11;
    core.position.set(local.x, local.y, local.z);
    core.userData.destinationId = dest.id;
    group.add(core);

    const ringGeo = new THREE.RingGeometry(
      baseRadius * 0.016,
      baseRadius * 0.028,
      32,
    );
    const matRing = new THREE.MeshBasicMaterial({
      color: cool,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });
    const ring = new THREE.Mesh(ringGeo, matRing);
    ring.renderOrder = 11;
    ring.position.set(local.x, local.y, local.z);
    // Face outward from globe center
    ring.lookAt(0, 0, 0);
    ring.rotateY(Math.PI);
    group.add(ring);

    pins.push({ core, ring, local, matCore, matRing, name: dest.name });
  }

  console.info(
    "[Elsewhere] Earth markers mounted:",
    DESTINATIONS.map((d) => d.id).join(", "),
    "radius~",
    radius.toFixed(1),
  );

  let t = 0;
  let disposed = false;

  function syncGroupToEarth() {
    // Prefer copying live Earth world matrix so parenting quirks don't matter
    try {
      const mesh = earthRoot._mesh || earthRoot.mesh || earthRoot;
      if (mesh?.matrixWorld) {
        mesh.updateWorldMatrix?.(true, false);
        group.matrixAutoUpdate = false;
        group.matrix.copy(mesh.matrixWorld);
        group.matrixWorldNeedsUpdate = true;
        return;
      }
      if (mesh?.position && mesh?.quaternion && mesh?.scale) {
        group.position.copy(mesh.position);
        group.quaternion.copy(mesh.quaternion);
        group.scale.copy(mesh.scale);
        return;
      }
    } catch {
      /* fall through */
    }

    // Fallback: apply same Y spin we drive on Spline objects
    const spin = getEarthSpinRad?.() ?? 0;
    group.rotation.set(0, spin, 0);
    try {
      if (earthRoot.position) {
        group.position.set(
          earthRoot.position.x || 0,
          earthRoot.position.y || 0,
          earthRoot.position.z || 0,
        );
      }
    } catch {
      /* ignore */
    }
  }

  function update(dt = 0.016) {
    if (disposed) return;
    t += dt;
    syncGroupToEarth();

    // Camera in world space for occlusion
    let cx = camera?.position?.x ?? 0;
    let cy = camera?.position?.y ?? 0;
    let cz = camera?.position?.z ?? 1000;
    try {
      // If group is in earth space, transform local pin to approx world via group matrix
    } catch {
      /* ignore */
    }

    const pulse = reducedMotion ? 0 : (Math.sin(t * 2.2) + 1) * 0.5;

    for (const pin of pins) {
      // World position ≈ group matrix * local
      const v = new THREE.Vector3(pin.local.x, pin.local.y, pin.local.z);
      v.applyMatrix4(group.matrixWorld);

      // Earth center world
      const center = new THREE.Vector3();
      center.setFromMatrixPosition(group.matrixWorld);

      const outward = v.clone().sub(center).normalize();
      const toCam = new THREE.Vector3(cx, cy, cz).sub(center).normalize();
      const facing = outward.dot(toCam); // 1 = near side, -1 = far

      const visible = Math.max(0, Math.min(1, (facing - 0.05) / 0.55));
      const coreOp = 0.2 + visible * 0.75;
      const ringOp = visible * (0.25 + pulse * 0.35);

      pin.matCore.opacity = coreOp;
      pin.matRing.opacity = ringOp;
      pin.core.visible = visible > 0.04;
      pin.ring.visible = visible > 0.08;

      if (!reducedMotion) {
        const s = 1 + pulse * 0.18 * visible;
        pin.ring.scale.set(s, s, s);
      }
    }
  }

  function dispose() {
    disposed = true;
    try {
      scene.remove(group);
    } catch {
      /* ignore */
    }
    for (const pin of pins) {
      try {
        pin.core.geometry?.dispose?.();
        pin.ring.geometry?.dispose?.();
        pin.matCore.dispose?.();
        pin.matRing.dispose?.();
      } catch {
        /* ignore */
      }
    }
    pins.length = 0;
  }

  return { update, dispose, group, pins };
}
