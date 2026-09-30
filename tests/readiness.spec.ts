import { test, expect, type Page } from '@playwright/test';

async function setup(page: Page, mode = 'ok') {
  await page.addInitScript((mode) => {
    let stopped = 0;
    Object.defineProperty(window, 'stoppedTracks', { get: () => stopped });
    Object.defineProperty(navigator, 'mediaDevices', { value: mode === 'missing' ? undefined : {
      getUserMedia: async () => {
        if (mode === 'denied') throw new DOMException('Denied', 'NotAllowedError');
        if (mode === 'pending') await new Promise(resolve => setTimeout(resolve, 500));
        return { getTracks: () => [{ stop: () => stopped++, addEventListener: () => {} }] };
      }
    } });
  }, mode);
  await page.goto('/');
}
async function orientation(page: Page, alpha: number, absolute = false, beta = 0) {
  await page.evaluate(({alpha, absolute, beta}) => window.dispatchEvent(new DeviceOrientationEvent(absolute ? 'deviceorientationabsolute' : 'deviceorientation', {alpha, beta, gamma: 0, absolute})), {alpha, absolute, beta});
}

test('explains permission, calibrates relative orientation, wraps north, recalibrates and stops', async ({page}) => {
  await setup(page);
  await expect(page.getByText(/Microphone access lets/)).toBeVisible();
  await page.getByRole('button', {name:'Start session', exact:true}).click();
  await orientation(page, 1);
  await expect(page.getByTestId('reference')).toContainText('Relative');
  await page.getByRole('button', {name:'Calibrate alignment', exact:true}).click();
  await orientation(page, 359);
  await expect(page.getByTestId('direction')).toHaveText('2° from calibration');
  await page.getByRole('button', {name:'Recalibrate alignment', exact:true}).click();
  await expect(page.getByTestId('direction')).toHaveText('0° from calibration');
  await page.getByRole('button', {name:'Stop session', exact:true}).click();
  await expect(page.getByTestId('session')).toHaveText('Session stopped');
  expect(await page.evaluate(() => (window as any).stoppedTracks)).toBe(1);
});
for (const mode of ['denied', 'missing']) test(`reports ${mode} microphone`, async ({page}) => {
  await setup(page, mode);
  await page.getByRole('button', {name:'Start session', exact:true}).click();
  await expect(page.getByTestId('microphone')).toContainText(mode === 'denied' ? 'denied' : 'unavailable');
});
test('reports absent and stale orientation', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:'Start session', exact:true}).click();
  await expect(page.getByTestId('orientation')).toContainText('unavailable', {timeout:6000});
  await orientation(page, 20);
  await page.getByRole('button', {name:'Calibrate alignment', exact:true}).click();
  await expect(page.getByTestId('orientation')).toContainText('unavailable', {timeout:6000});
  await expect(page.getByTestId('direction')).toHaveText('Calibration needed');
});
test('promotes steady absolute heading and invalidates calibration after instability', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:'Start session', exact:true}).click();
  for (let i=0;i<7;i++) { await orientation(page, i%2 ? 359 : 1, true); await page.waitForTimeout(200); }
  await expect(page.getByTestId('reference')).toContainText('Stable geographic');
  await page.getByRole('button', {name:'Calibrate alignment', exact:true}).click();
  await orientation(page, 120, true);
  await expect(page.getByTestId('reference')).toContainText('Relative');
  await expect(page.getByTestId('direction')).toHaveText('Calibration needed');
});
test('stop while permission is pending releases late microphone stream', async ({page}) => {
  await setup(page, 'pending');
  await page.getByRole('button', {name:'Start session', exact:true}).click();
  await page.getByRole('button', {name:'Stop session', exact:true}).click();
  await expect.poll(() => page.evaluate(() => (window as any).stoppedTracks)).toBe(1);
  await expect(page.getByTestId('session')).toHaveText('Session stopped');
});

test('invalid tilt clears calibration and fresh data allows recovery', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:'Start session', exact:true}).click();
  await orientation(page, 45);
  await page.getByRole('button', {name:'Calibrate alignment', exact:true}).click();
  await orientation(page, 45, false, 90);
  await expect(page.getByTestId('orientation')).toContainText('Hold the screen nearer level');
  await expect(page.getByRole('button', {name:'Calibrate alignment', exact:true})).toBeDisabled();
  await orientation(page, 45);
  await expect(page.getByRole('button', {name:'Calibrate alignment', exact:true})).toBeEnabled();
});

test('a stopped session can restart with fresh calibration', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:'Start session', exact:true}).click();
  await orientation(page, 80);
  await page.getByRole('button', {name:'Calibrate alignment', exact:true}).click();
  await page.getByRole('button', {name:'Stop session', exact:true}).click();
  await page.getByRole('button', {name:'Start session', exact:true}).click();
  await orientation(page, 120);
  await expect(page.getByTestId('direction')).toHaveText('Calibration needed');
});

test('a rapid small heading jump invalidates a previously stable reference', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:'Start session', exact:true}).click();
  for (let i=0;i<7;i++) { await orientation(page, 0, true); await page.waitForTimeout(200); }
  await page.getByRole('button', {name:'Calibrate alignment', exact:true}).click();
  await page.evaluate(() => {
    for (const alpha of [0, 4]) window.dispatchEvent(new DeviceOrientationEvent('deviceorientationabsolute', {alpha, beta:0, gamma:0, absolute:true}));
  });
  await expect(page.getByTestId('reference')).toContainText('Relative');
  await expect(page.getByTestId('direction')).toHaveText('Calibration needed');
});

test('backgrounding releases the microphone and clears calibration', async ({page}) => {
  await setup(page);
  await page.getByRole('button', {name:'Start session', exact:true}).click();
  await orientation(page, 90);
  await page.getByRole('button', {name:'Calibrate alignment', exact:true}).click();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {value:true, configurable:true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByTestId('session')).toContainText('background');
  await expect(page.getByTestId('direction')).toHaveText('Calibration needed');
  expect(await page.evaluate(() => (window as any).stoppedTracks)).toBe(1);
});
