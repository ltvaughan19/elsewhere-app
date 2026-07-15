# Earth destination markers (feat/earth-destination-markers)

## What this does
Soft glowing pins for Philippines, Thailand, Mexico on the Spline Earth hero.
Separate Three.js meshes synced to Earth rotation — **does not** edit Earth textures/materials.

## Kill switch (instant)
In `apps/web/.env.local` or Vercel:
```
NEXT_PUBLIC_EARTH_MARKERS=0
```
Redeploy / restart dev. Markers skip entirely; scroll camera + spin unchanged.

## Full code revert
```powershell
git checkout main
# or
git revert <markers-commit-sha>
```

## Calibration
If pins sit in the wrong ocean, edit `MARKER_CALIBRATION` in
`apps/web/lib/marketing/earthMarkers.js` (`lngOffsetDeg` / `latOffsetDeg`).

## Files
- `apps/web/lib/marketing/earthMarkers.js` (new)
- `apps/web/lib/marketing/splineScene.js` (wire-up only)
- `three` dependency
