# bipcompass

[Try the live readiness prototype](https://bipcompass.surge.sh/) in Chrome on
your phone. It currently checks device access and alignment; beep decoding is
not implemented yet.

BipCompass is a companion PWA for the [Drone Finder ELRS script for the
RadioMaster Pocket](https://github.com/andrewliyanage83/Drone-Finder-ELRS-Pocket).
The script reports ELRS signal telemetry on the radio and encodes its signal
indicator in audible beeps. BipCompass is designed to run on an Android phone
mounted to the radio, listen to those beeps, estimate the encoded signal level,
and associate each reading with the phone's orientation.

The app presents signal readings by direction as a compass rose, along with
scan coverage and candidate sectors to explore. The goal is to help a pilot
search for a powered drone while its ELRS telemetry link is active, using the
existing radio script without modifying it.

BipCompass does not calculate the drone's position or distance, and its readings
do not provide a guaranteed bearing. Antenna patterns, reflections, the pilot's
body, radio power changes, and phone sensor accuracy can all affect the results.
The directional guidance is experimental and must be validated in field tests.

The initial target is a Google Pixel 8 running Chrome on Android, with the phone
fixed to the RadioMaster Pocket. BipCompass has an initial device-readiness prototype; phone sensor access
on the target hardware, beep decoding, and field performance have not yet been
validated.

## Readiness prototype (issue #2)

The first slice checks microphone and orientation access and calibrates a
relative zero for the mounted radio. It does not decode beeps or collect scans.
PWA installation and offline caching belong to later stages of the parent spec.

Requires Node.js 22.12 or newer. Run `npm ci`, then `npm run dev`.
Use `npm run typecheck`, `npm test`, and `npm run build` for validation.
Install the browser for automated tests with `npx playwright install chromium`.
Serve `dist/` over HTTPS for phone testing. Plain HTTP on a LAN address cannot
provide microphone access; localhost is only suitable for desktop development.

Mount the phone with its screen facing up, within 60 degrees of level. Point
the radio toward the chosen starting direction and tap Calibrate alignment.
The projected phone top edge supplies the orientation reference; calibration
subtracts its starting angle so a fixed sideways mount is supported. The
readout is always relative to this calibration, including when the underlying
sensor provides a geographic reference. It is not a drone bearing.

Absolute events qualify as a stable geographic reference after at least five
readings spanning one second within five degrees, accounting for north wrap.
A jump over 90 degrees per second demotes that reference. These are prototype
heuristics, not proof of compass accuracy. Relative events are used when no
fresh absolute event exists. Reference changes, unusable tilt, and readings
older than three seconds invalidate calibration. A stopped or backgrounded
session releases microphone access and requires calibration again.

Orientation math follows the [W3C device orientation coordinate system](https://www.w3.org/TR/orientation-event/).
Audio access requests disable voice processing where supported. This slice
opens the microphone but does not process, record, or transmit its audio.

## Pixel 8 acceptance checks

Hardware validation is still pending. Browser tests use controlled microphone
and orientation inputs and cannot establish real sensor accuracy.

- In Android Chrome over HTTPS, confirm the explanation appears before the
  permission prompt. Allow, deny, and reset microphone permission, then retry.
- Start and stop repeatedly, including stopping during a permission prompt.
  Check that the microphone indicator disappears after Stop and backgrounding.
- Confirm unavailable microphone and absent orientation data are reported.
- Hold the mounted radio still, check the heading reference, then rotate slowly
  across north. Verify the reference against a known direction outdoors, away
  from magnetic interference, and check relative fallback with unstable input.
- Calibrate one-handed, rotate the radio about 90 degrees clockwise, and check
  the displayed change. Recalibrate and confirm zero with the mount unchanged.
- Tilt past the allowed range, interrupt sensors, or background the app. Confirm
  stale calibration is cleared, and recalibrate after returning.
- Repeat with the actual mount and radio powered on. Record Chrome/Android
  versions, mounting angle, observed sensor behavior, and discrepancies before
  claiming device acceptance. Radio tone decoding and installed/offline PWA
  acceptance are deferred to their respective implementation stages.
