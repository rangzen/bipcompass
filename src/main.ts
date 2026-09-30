import './style.css';

const app = document.querySelector<HTMLElement>('#app')!;
app.innerHTML = `
  <header><p>BIPCOMPASS / DEVICE CHECK</p><h1>Ready for a sweep?</h1><p>Mount your phone firmly to the RadioMaster Pocket.</p></header>
  <section aria-labelledby="session-title"><h2 id="session-title">1. Check your phone</h2>
  <p>Microphone access lets BipCompass listen to the radio's beeps. Audio stays on this phone, with no recording or upload. This prototype checks access; beep decoding comes later.</p>
  <p data-testid="session" role="status">Session stopped</p>
  <dl><dt>Microphone</dt><dd data-testid="microphone">Not checked</dd><dt>Orientation</dt><dd data-testid="orientation">Not checked</dd><dt>Heading reference</dt><dd data-testid="reference">Not checked</dd></dl>
  <button id="start">Start session</button><button id="stop" disabled>Stop session</button></section>
  <section aria-labelledby="alignment-title"><h2 id="alignment-title">2. Align with the radio</h2>
  <p>Hold the mounted phone screen facing up, tilted less than 60° from level. Point the radio in your chosen starting direction and tap Calibrate. That direction becomes zero, even if the phone is mounted sideways. Keep the mount fixed during a sweep.</p>
  <p>Hold still for a geographic heading check. A relative reference has no north. Recalibrate after moving the mount or changing references.</p>
  <strong data-testid="direction">Calibration needed</strong><p id="readiness" role="status">Start a session to check readiness.</p>
  <button id="calibrate" disabled>Calibrate alignment</button></section>
  <footer>Experimental directional aid. No drone position, distance, or guaranteed bearing.</footer>`;
const output = (id: string, value: string) => { app.querySelector<HTMLElement>(`[data-testid="${id}"]`)!.textContent = value; };
const start = app.querySelector<HTMLButtonElement>('#start')!;
const stop = app.querySelector<HTMLButtonElement>('#stop')!;
const calibrate = app.querySelector<HTMLButtonElement>('#calibrate')!;
const readiness = app.querySelector<HTMLElement>('#readiness')!;
const wrap = (angle: number) => (angle % 360 + 360) % 360;
const distance = (a: number, b: number) => Math.abs((a - b + 540) % 360 - 180);
let active = false;
let generation = 0;
let stream: MediaStream | undefined;
let microphoneReady = false;
let lastReading = 0;
let lastAbsolute = 0;
let heading: number | undefined;
let baseline: number | undefined;
let reference = '';
let source = '';
let samples: { heading: number; time: number }[] = [];
let previous: { heading: number; time: number } | undefined;
let timer: number | undefined;

function render() {
  calibrate.disabled = !active || !microphoneReady || heading === undefined;
  calibrate.textContent = baseline === undefined ? 'Calibrate alignment' : 'Recalibrate alignment';
  output('direction', heading !== undefined && baseline !== undefined ? `${Math.round(wrap(heading - baseline)) % 360}° from calibration` : 'Calibration needed');
  readiness.textContent = !active ? 'Start a session to check readiness.' : !microphoneReady ? 'Microphone access is required.' : heading === undefined ? 'Waiting for usable orientation.' : baseline === undefined ? 'Orientation available. Calibrate before a sweep.' : 'Ready for a sweep. Beep decoding is not implemented yet.';
}
function clearOrientation(message: string) {
  heading = undefined; baseline = undefined; reference = ''; source = ''; samples = []; previous = undefined; lastAbsolute = 0;
  output('orientation', message); output('reference', 'Unavailable'); render();
}
function onOrientation(event: DeviceOrientationEvent) {
  if (!active) return;
  const now = performance.now();
  if (!event.absolute && now - lastAbsolute < 1000 && lastAbsolute > 0) return;
  if (event.alpha === null || event.beta === null || event.gamma === null || ![event.alpha, event.beta, event.gamma].every(Number.isFinite)) return;
  // The top edge projected onto the horizontal plane is (-cos(beta)*sin(alpha), cos(beta)*cos(alpha)).
  // Constrain tilt so this vector remains usable and the mount has a repeatable reference.
  const vertical = Math.cos(event.beta * Math.PI / 180) * Math.cos(event.gamma * Math.PI / 180);
  if (vertical < 0.5) { clearOrientation('Tilt unavailable for alignment. Hold the screen nearer level.'); return; }
  const nextSource = event.absolute ? 'absolute' : 'relative';
  if (nextSource !== source) { samples = []; previous = undefined; baseline = undefined; source = nextSource; }
  if (event.absolute) lastAbsolute = now;
  heading = wrap(360 - event.alpha);
  lastReading = now;
  const rapid = previous && distance(heading, previous.heading) / Math.max((now - previous.time) / 1000, 0.001) > 90;
  previous = { heading, time: now };
  if (rapid) samples = [];
  samples.push({ heading, time: now });
  samples = samples.filter(sample => now - sample.time <= 1600);
  const steady = event.absolute && samples.length >= 5 && now - samples[0].time >= 1000 && samples.every(sample => distance(sample.heading, heading!) <= 5);
  const nextReference = event.absolute && !rapid && (steady || reference === 'geographic') ? 'geographic' : 'relative';
  if (reference !== nextReference) baseline = undefined;
  reference = nextReference;
  output('orientation', 'Available');
  output('reference', reference === 'geographic' ? 'Stable geographic heading (sensor estimate, verify outdoors)' : 'Relative orientation reference (north unavailable or not stable)');
  render();
}
function endSession(message = 'Session stopped') {
  active = false; generation++; microphoneReady = false;
  stream?.getTracks().forEach(track => track.stop()); stream = undefined;
  window.removeEventListener('deviceorientation', onOrientation);
  window.removeEventListener('deviceorientationabsolute', onOrientation);
  window.clearInterval(timer);
  start.disabled = false; stop.disabled = true;
  output('session', message); output('microphone', 'Off'); clearOrientation('Not checked');
}
start.addEventListener('click', async () => {
  active = true; const request = ++generation;
  start.disabled = true; stop.disabled = false;
  output('session', 'Session starting'); output('microphone', 'Waiting for permission'); clearOrientation('Waiting for orientation');
  lastReading = performance.now();
  window.addEventListener('deviceorientation', onOrientation);
  window.addEventListener('deviceorientationabsolute', onOrientation);
  timer = window.setInterval(() => { if (performance.now() - lastReading > 3000) clearOrientation('Orientation unavailable or stale. Check sensor access and hold the phone level.'); }, 250);
  try {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new DOMException('Unavailable', 'NotSupportedError');
    const acquired = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    if (!active || request !== generation) { acquired.getTracks().forEach(track => track.stop()); return; }
    stream = acquired; microphoneReady = true;
    stream.getTracks().forEach(track => track.addEventListener('ended', () => { if (active && request === generation) { endSession(); output('microphone', 'Microphone unavailable: access ended. Start again to retry.'); } }));
    output('microphone', 'Available, listening locally'); output('session', 'Session active'); render();
  } catch (error) {
    if (request !== generation) return;
    endSession();
    const denied = error instanceof DOMException && ['NotAllowedError', 'SecurityError'].includes(error.name);
    output('microphone', denied ? 'Microphone access denied. Allow microphone access in site settings, then try again.' : 'Microphone unavailable. Use HTTPS and check that a microphone is connected and not busy, then try again.');
  }
});
stop.addEventListener('click', () => endSession());
calibrate.addEventListener('click', () => { if (!calibrate.disabled) { baseline = heading; render(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && active) endSession('Session stopped because the app went into the background'); });
window.addEventListener('pagehide', () => { if (active) endSession(); });
