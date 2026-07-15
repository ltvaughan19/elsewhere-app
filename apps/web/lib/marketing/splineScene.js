import { Application } from "@splinetool/runtime";
import { createEarthMarkers, EARTH_MARKERS_ENABLED, measureEarthRadius } from "./earthMarkers.js";

/** Exported from your Spline project (Code export). */
export const SPLINE_SCENE_URL =
  "https://prod.spline.design/Lnx4uENq006e5zkU/scene.splinecode";

/** Revert markers: set NEXT_PUBLIC_EARTH_MARKERS=0 or remove createEarthMarkers usage below. */

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function catmullRom(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function samplePath(points, t) {
  const n = points.length - 1;
  const x = Math.min(0.9999, Math.max(0, t)) * n;
  const i = Math.floor(x);
  const u = x - i;
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[Math.min(n, i + 1)];
  const p3 = points[Math.min(n, i + 2)];
  return {
    x: catmullRom(p0.x, p1.x, p2.x, p3.x, u),
    y: catmullRom(p0.y, p1.y, p2.y, p3.y, u),
    z: catmullRom(p0.z, p1.z, p2.z, p3.z, u),
  };
}

/**
 * Cinematic camera path: far space → slow approach with gentle orbital arc.
 * Units relative to Earth at origin; scaled to the live scene after load.
 */
const CAMERA_WAYPOINTS = [
  { x: 30, y: 240, z: 1250 }, // deep space / full limb
  { x: 90, y: 170, z: 980 }, // wide establishing
  { x: 160, y: 120, z: 720 }, // beginning the approach
  { x: 210, y: 75, z: 480 }, // mid — partial orbit
  { x: 190, y: 48, z: 300 }, // near atmosphere
  { x: 130, y: 30, z: 190 }, // intimate orbital
];

const LOOK_WAYPOINTS = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 2, z: 0 },
  { x: 6, y: 4, z: -4 },
  { x: 18, y: 6, z: -10 },
  { x: 28, y: 8, z: -14 },
  { x: 36, y: 10, z: -16 },
];

function findByName(app, names) {
  for (const name of names) {
    try {
      const obj = app.findObjectByName(name);
      if (obj) return obj;
    } catch {
      /* continue */
    }
  }
  return null;
}

function collectNames(app) {
  const names = [];
  try {
    if (typeof app.getAllObjects === "function") {
      for (const o of app.getAllObjects()) {
        if (o?.name) names.push(o.name);
      }
    }
  } catch {
    /* ignore */
  }
  return names;
}

/**
 * Soften specular / metal glare on the globe while keeping sunlight.
 * Does not replace Earth textures/maps.
 */
function reduceGlobeGlare(app, spinTargets = []) {
  let matCount = 0;
  let lightCount = 0;

  function softenMaterial(mat) {
    if (!mat || typeof mat !== "object") return;
    const list = Array.isArray(mat) ? mat : [mat];
    for (const m of list) {
      if (!m) continue;
      try {
        if ("metalness" in m && typeof m.metalness === "number") {
          m.metalness = Math.min(m.metalness, 0.1);
        }
        if ("roughness" in m && typeof m.roughness === "number") {
          m.roughness = Math.max(m.roughness, 0.68);
        }
        if ("envMapIntensity" in m && typeof m.envMapIntensity === "number") {
          m.envMapIntensity *= 0.36;
        }
        if ("specularIntensity" in m && typeof m.specularIntensity === "number") {
          m.specularIntensity *= 0.34;
        }
        if ("shininess" in m && typeof m.shininess === "number") {
          m.shininess = Math.min(m.shininess, 16);
        }
        if (m.specular && m.specular.isColor) {
          m.specular.setRGB(0.16, 0.16, 0.16);
        } else if (m.specular && typeof m.specular === "object" && "r" in m.specular) {
          m.specular.r = 0.16;
          m.specular.g = 0.16;
          m.specular.b = 0.16;
        }
        if ("reflectivity" in m && typeof m.reflectivity === "number") {
          m.reflectivity = Math.min(m.reflectivity, 0.2);
        }
        if ("emissiveIntensity" in m && typeof m.emissiveIntensity === "number") {
          m.emissiveIntensity = Math.min(
            (m.emissiveIntensity || 0) + 0.02,
            0.12
          );
        }
        if (m.color && m.color.isColor && typeof m.color.multiplyScalar === "function") {
          m.color.multiplyScalar(1.04);
        }
        m.needsUpdate = true;
        matCount += 1;
      } catch {
        /* ignore single mat */
      }
    }
  }

  function softenObject(obj) {
    if (!obj) return;
    try {
      if (obj.material) softenMaterial(obj.material);
      if (obj._mesh?.material) softenMaterial(obj._mesh.material);
      if (obj.mesh?.material) softenMaterial(obj.mesh.material);
    } catch {
      /* ignore */
    }
  }

  for (const t of spinTargets) softenObject(t);

  try {
    if (typeof app.getAllObjects === "function") {
      for (const o of app.getAllObjects()) {
        if (o?.name && /earth|globe|planet|ocean|land|sphere|water|cloud/i.test(o.name)) {
          softenObject(o);
        }
      }
    }
  } catch {
    /* ignore */
  }

  const threeRoots = [
    app._scene,
    app.scene,
    app._renderer?.scene,
    app.renderer?.scene,
  ].filter(Boolean);

  function traverseThree(node) {
    if (!node) return;
    if (node.isMesh || node.isSkinnedMesh) {
      softenMaterial(node.material);
    }
    if (node.isDirectionalLight || node.isSpotLight) {
      try {
        if (typeof node.intensity === "number" && node.intensity > 0.4) {
          node.intensity *= 0.82;
          lightCount += 1;
        }
      } catch {
        /* ignore */
      }
    }
    if (node.isHemisphereLight || node.isAmbientLight) {
      try {
        if (typeof node.intensity === "number") {
          node.intensity = Math.min(node.intensity * 1.12, node.intensity + 0.18);
        }
      } catch {
        /* ignore */
      }
    }
    const kids = node.children;
    if (kids?.length) {
      for (const c of kids) traverseThree(c);
    }
  }

  for (const root of threeRoots) {
    try {
      traverseThree(root);
    } catch {
      /* ignore */
    }
  }

  console.info(
    "[Elsewhere] Glare soften — materials:",
    matCount,
    "lights adjusted:",
    lightCount
  );
  return { matCount, lightCount };
}

/**
 * Load Spline Earth and drive cinematic camera + rotation from scroll 0→1.
 */
export async function createSplineScene(canvas, { onReady, onError } = {}) {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const app = new Application(canvas, {
    renderMode: "continuous",
  });

  let camera = null;
  /** @type {any[]} */
  let spinTargets = [];
  let scale = 1;
  let progress = 0;
  let targetProgress = 0;
  let earthSpin = 0;
  let ready = false;
  let baseCamPos = null;
  let objectNames = [];
  let rotationIsDegrees = false;
  const SECONDS_PER_REVOLUTION = 180;
  let lastCamPos = { x: 0, y: 240, z: 1250 };
  let lastLook = { x: 0, y: 0, z: 0 };
  let cameraFound = false;

  try {
    await app.load(SPLINE_SCENE_URL);
  } catch (err) {
    console.error("[Elsewhere] Spline load failed", err);
    onError?.(err);
    throw err;
  }

  objectNames = collectNames(app);
  console.info("[Elsewhere] Spline objects:", objectNames);

  camera = findByName(app, [
    "Camera",
    "camera",
    "Main Camera",
    "Perspective Camera",
    "Cam",
    "Camera 1",
    "Camera1",
    "Hero Camera",
  ]);

  // If named camera missing, try any object with camera-like name
  if (!camera) {
    for (const n of objectNames) {
      if (/cam/i.test(n)) {
        camera = findByName(app, [n]);
        if (camera) break;
      }
    }
  }
  cameraFound = !!(camera && camera.position);
  console.info(
    "[Elsewhere] Camera:",
    cameraFound ? camera.name || "found" : "NOT FOUND — path disabled"
  );

  const spinNameHints =
    /earth|globe|planet|world|sphere|cloud|atmos|night|day|ocean|land/i;
  const seen = new Set();
  function addSpinTarget(obj) {
    if (!obj?.rotation || seen.has(obj)) return;
    seen.add(obj);
    spinTargets.push(obj);
  }

  for (const name of [
    "Earth",
    "earth",
    "Globe",
    "Planet",
    "Sphere",
    "Earth Day",
    "Earth Night",
    "world",
    "Clouds",
    "Atmosphere",
  ]) {
    addSpinTarget(findByName(app, [name]));
  }
  for (const n of objectNames) {
    if (spinNameHints.test(n)) {
      try {
        addSpinTarget(app.findObjectByName(n));
      } catch {
        /* ignore */
      }
    }
  }

  if (spinTargets[0]?.rotation) {
    const ry = Math.abs(spinTargets[0].rotation.y ?? 0);
    const rx = Math.abs(spinTargets[0].rotation.x ?? 0);
    const rz = Math.abs(spinTargets[0].rotation.z ?? 0);
    rotationIsDegrees = ry > 6.5 || rx > 6.5 || rz > 6.5;
    earthSpin = spinTargets[0].rotation.y ?? 0;
  }
  console.info(
    "[Elsewhere] Spin targets:",
    spinTargets.length,
    "units:",
    rotationIsDegrees ? "degrees" : "radians"
  );

  reduceGlobeGlare(app, spinTargets);
  requestAnimationFrame(() => reduceGlobeGlare(app, spinTargets));
  setTimeout(() => reduceGlobeGlare(app, spinTargets), 500);

  let measuredEarthRadius = 0;
  let measuredFovDeg = 45;

  function readCameraFov() {
    try {
      const f = camera?.fov ?? camera?._camera?.fov ?? camera?.perspectiveCamera?.fov;
      if (typeof f === "number" && f > 5 && f < 120) return f;
    } catch {
      /* default */
    }
    return 45;
  }

  function remeasureEarth() {
    const cam = lastCamPos || camera?.position || { x: 0, y: 240, z: 1250 };
    measuredEarthRadius = measureEarthRadius(
      spinTargets[0] ?? null,
      cam,
      spinTargets,
    );
    // Prefer true Earth/Globe over cloud shells if we can name-match
    try {
      for (const t of spinTargets) {
        const n = String(t?.name || "");
        if (/cloud|atmos|atmosphere/i.test(n)) continue;
        if (/earth|globe|planet|world/i.test(n)) {
          const r = measureEarthRadius(t, cam, [t]);
          if (r > 1) measuredEarthRadius = r;
          break;
        }
      }
    } catch {
      /* keep best */
    }
    measuredFovDeg = readCameraFov();
  }

  let earthMarkers = { update() {}, dispose() {} };
  if (EARTH_MARKERS_ENABLED) {
    remeasureEarth();
    console.info(
      "[Elsewhere] Measured earth radius ~",
      measuredEarthRadius,
      "fov",
      measuredFovDeg,
    );
    // Geometry may finish loading a tick later
    setTimeout(() => {
      remeasureEarth();
      console.info("[Elsewhere] Re-measured earth radius ~", measuredEarthRadius);
    }, 800);

    try {
      earthMarkers = await createEarthMarkers({
        canvas,
        getPose: () => {
          const spinRad = rotationIsDegrees
            ? (earthSpin * Math.PI) / 180
            : earthSpin;
          const cam = { ...lastCamPos };
          const radius =
            measuredEarthRadius > 1
              ? measuredEarthRadius
              : measureEarthRadius(spinTargets[0] ?? null, cam, spinTargets);
          let earthCenter = { x: 0, y: 0, z: 0 };
          try {
            const e =
              spinTargets.find((t) =>
                /earth|globe|planet|world/i.test(String(t?.name || "")),
              ) || spinTargets[0];
            if (e?.position) {
              earthCenter = {
                x: e.position.x || 0,
                y: e.position.y || 0,
                z: e.position.z || 0,
              };
            }
          } catch {
            /* origin */
          }
          return {
            ready,
            cam,
            look: { ...lastLook },
            earthSpinRad: spinRad,
            earthRadius: radius,
            earthCenter,
            fovDeg: measuredFovDeg,
            scale,
            progress,
            cameraFound,
          };
        },
        reducedMotion,
      });
    } catch (err) {
      console.warn("[Elsewhere] Earth markers failed — continuing without", err);
      earthMarkers = { update() {}, dispose() {} };
    }
  }

  try {
    for (const obj of spinTargets) {
      if (typeof obj.emitEvent === "function") {
        try {
          obj.emitEvent("mouseUp");
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }

  if (camera?.position) {
    baseCamPos = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    };
    lastCamPos = { ...baseCamPos };
    const dist = Math.hypot(baseCamPos.x, baseCamPos.y, baseCamPos.z) || 1000;
    scale = dist / 1000;
  } else {
    // Default scale if camera object missing
    scale = 1;
  }

  canvas.style.pointerEvents = "none";
  canvas.style.touchAction = "none";

  ready = true;
  onReady?.({
    app,
    camera,
    earth: spinTargets[0] ?? null,
    objectNames,
    spinTargets,
    cameraFound,
  });

  function setProgress(p) {
    targetProgress = Math.min(1, Math.max(0, p));
    if (reducedMotion) progress = targetProgress;
  }

  /**
   * Smooth cinematic approach: mostly in first ~60% of page scroll,
   * with gentle orbital rotation around the globe.
   */
  function applyCamera(p) {
    if (!camera?.position) return;

    // Concentrate camera move on hero → mid story for a readable descent
    const camSpan = smoothstep(0, 0.62, p);
    // Smooth ease-in-out along the path (not linear snap)
    const pathT = camSpan * camSpan * (3 - 2 * camSpan);

    let pos = samplePath(
      CAMERA_WAYPOINTS.map((w) => ({
        x: w.x * scale,
        y: w.y * scale,
        z: w.z * scale,
      })),
      pathT
    );
    const look = samplePath(
      LOOK_WAYPOINTS.map((w) => ({
        x: w.x * scale,
        y: w.y * scale,
        z: w.z * scale,
      })),
      pathT
    );

    // Extra orbital swing around Y so the approach feels cinematic, not a zoom
    const orbit = pathT * Math.PI * 0.55; // ~99° of gentle arc
    const cos = Math.cos(orbit);
    const sin = Math.sin(orbit);
    const ox = pos.x;
    const oz = pos.z;
    pos = {
      x: ox * cos + oz * sin,
      y: pos.y,
      z: -ox * sin + oz * cos,
    };

    // Blend from Spline default framing into our path
    const blend = smoothstep(0, 0.1, p);
    if (baseCamPos) {
      pos.x = lerp(baseCamPos.x, pos.x, blend);
      pos.y = lerp(baseCamPos.y, pos.y, blend);
      pos.z = lerp(baseCamPos.z, pos.z, blend);
    }

    camera.position.x = pos.x;
    camera.position.y = pos.y;
    camera.position.z = pos.z;
    lastCamPos = { x: pos.x, y: pos.y, z: pos.z };
    lastLook = { x: look.x, y: look.y, z: look.z };

    const dx = look.x - pos.x;
    const dy = look.y - pos.y;
    const dz = look.z - pos.z;
    const yaw = Math.atan2(dx, dz);
    const pitch = Math.atan2(dy, Math.hypot(dx, dz));

    if (camera.rotation) {
      // Spline SPEObject rotations are typically degrees
      camera.rotation.y = (yaw * 180) / Math.PI;
      camera.rotation.x = (-pitch * 180) / Math.PI;
      if ("z" in camera.rotation) {
        // Slight bank through the orbit for cinema
        camera.rotation.z = Math.sin(orbit) * 4;
      }
    }
  }

  function getPose() {
    const spinRad = rotationIsDegrees
      ? (earthSpin * Math.PI) / 180
      : earthSpin;
    const cam = { ...lastCamPos };
    const radius =
      measuredEarthRadius > 1
        ? measuredEarthRadius
        : measureEarthRadius(spinTargets[0] ?? null, cam, spinTargets);
    return {
      ready,
      cam,
      look: { ...lastLook },
      earthSpinRad: spinRad,
      earthRadius: radius,
      fovDeg: measuredFovDeg,
      scale,
      progress,
      cameraFound,
    };
  }

  function applyEarthSpin(dt) {
    if (!spinTargets.length) return;

    const fullTurn = rotationIsDegrees ? 360 : Math.PI * 2;
    // Slow the planet slightly as we approach (calmer, clearer)
    const seconds = lerp(
      SECONDS_PER_REVOLUTION,
      SECONDS_PER_REVOLUTION * 1.45,
      smoothstep(0.15, 0.7, progress)
    );
    const rate = fullTurn / seconds;

    if (!reducedMotion) {
      earthSpin += rate * dt;
    }

    if (rotationIsDegrees) {
      earthSpin = ((earthSpin % 360) + 360) % 360;
    } else {
      earthSpin = earthSpin % (Math.PI * 2);
    }

    for (const obj of spinTargets) {
      if (!obj?.rotation) continue;
      obj.rotation.y = earthSpin;
    }
  }

  let last = performance.now();
  let raf = 0;

  function tick(now = performance.now()) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // Smooth follow of scroll progress (cinematic lag, not snappy)
    if (!reducedMotion) {
      progress += (targetProgress - progress) * Math.min(1, dt * 2.15);
    } else {
      progress = targetProgress;
    }

    if (ready) {
      applyCamera(progress);
      applyEarthSpin(dt);
      applyEarthSpin(0);
      earthMarkers.update?.(dt);
    }

    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);

  function resize() {
    try {
      app.setSize(canvas.clientWidth, canvas.clientHeight);
    } catch {
      /* ignore */
    }
  }

  window.addEventListener("resize", resize);
  resize();

  return {
    setProgress,
    getProgress: () => progress,
    getPose,
    getApp: () => app,
    getObjectNames: () => objectNames,
    hasCamera: () => cameraFound,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      try {
        earthMarkers.dispose?.();
      } catch {
        /* ignore */
      }
      try {
        app.dispose?.();
      } catch {
        /* ignore */
      }
    },
  };
}
