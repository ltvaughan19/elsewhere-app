# Earth destination markers (feat/earth-destination-markers)

## What this does
Soft glowing **DOM pins** for Philippines, Thailand, Mexico projected from
Earth lat/lng + spin + camera. We do **not** inject a second `three` copy into
Spline’s scene (that often renders invisible).

Still **does not** edit Earth textures/materials.

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
`apps/web/lib/marketing/earthMarkers.js`:

| Knob | When |
|------|------|
| `lngOffsetDeg` | Pins wrong longitude / in ocean |
| `latOffsetDeg` | Pins too N/S |
| `spinSign` | Pins drift opposite land as Earth turns (`1` or `-1`) |
| `radiusScale` | Slightly above/below surface |

**Symptom guide:** pins clustered in the *middle of the disk* → radius too small
(check console `[Elsewhere] Measured earth radius`). Pins on land but wrong country → longitude offset. Far-side pins ghosting through ocean → facing threshold (already hardened).

## Files
- `apps/web/lib/marketing/earthMarkers.js` (new)
- `apps/web/lib/marketing/splineScene.js` (wire-up only)
- `three` dependency
