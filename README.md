# bipcompass

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
fixed to the RadioMaster Pocket. BipCompass is still at the planning stage;
phone sensor access, beep decoding, and field performance have not yet been
validated.
