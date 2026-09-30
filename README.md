# BipCompass

An experimental Android web app for finding a powered drone using the
[RadioMaster Pocket Drone Finder script](https://github.com/andrewliyanage83/Drone-Finder-ELRS-Pocket),
its audio beeps, and phone orientation.

**Work in progress:** microphone access, orientation checks, and alignment
calibration are available. Beep decoding and directional guidance are not yet
implemented. Target device: Pixel 8 with Chrome.

**[Try BipCompass](https://bipcompass.surge.sh/)**

## Run locally

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

See [prototype details and testing](docs/readiness-prototype.md) for development
and device validation instructions.
