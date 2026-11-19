import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const indexPath = path.resolve(process.cwd(), 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

function extractMainScript(source: string): string {
  const scripts = [...source.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const main = scripts.find((s) => s.includes('const SITE_CONFIG'));
  assert.ok(main, 'Expected inline SITE_CONFIG script block in index.html');
  return main;
}

function loadPureHelpers() {
  const script = extractMainScript(html);
  // Extract definitions up to the IIFE so we can unit-test pure helpers in isolation
  const pureSection = script.split('// 1. Hydrate')[0];
  const sandbox: Record<string, unknown> = {
    encodeURIComponent,
    Number,
    Math,
    Date,
  };
  vm.runInNewContext(
    `${pureSection}
    this.__exports = { SITE_CONFIG, PACKAGE_RATES, buildWaLink, formatRupiah, formatIndonesianDate, calculateEstimate, buildCalculatorMessage, createFallbackSvg };`,
    sandbox
  );
  return sandbox.__exports as {
    SITE_CONFIG: Record<string, string>;
    PACKAGE_RATES: Record<string, { base: number; perBoxMin: number; perBoxMax: number }>;
    buildWaLink: (text: string, waNumber?: string) => string;
    formatRupiah: (amount: number) => string;
    formatIndonesianDate: (isoDate: string) => string;
    calculateEstimate: (paket: string, qty: number) => { minTotal: number; maxTotal: number; label: string };
    buildCalculatorMessage: (brandName: string, paket: string, qty: number, isoDate: string) => string;
    createFallbackSvg: (label: string) => string;
  };
}

test('single-file static architecture constraints hold', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /https:\/\/cdn\.tailwindcss\.com/);
  assert.match(html, /Playfair\+Display/, 'Expected Playfair Display font loaded for clean headings');
  assert.doesNotMatch(html, /Fraunces/, 'Fraunces should be fully replaced by Playfair Display');
  assert.match(html, /dimasak fresh di hari yang sama/i, 'Expected same-day fresh cooking USP copy');
  assert.doesNotMatch(html, /src="\/src\/main\.tsx"/, 'Must not depend on React/Vite runtime');
  assert.doesNotMatch(html, /\bh-18\b/, 'Must not use invalid Tailwind v3 utility h-18');
  assert.doesNotMatch(html, /\bshadow-2xs\b/, 'Must not use Tailwind v4-only shadow-2xs with v3 CDN');
});

test('WhatsApp OpenGraph & SEO metadata are present', () => {
  assert.match(html, /<meta[^>]+name="description"[^>]+Rumah Aqiqah Semarang/i);
  assert.match(html, /<meta[^>]+property="og:title"[^>]+Rumah Aqiqah Semarang/i);
  assert.match(html, /<meta[^>]+property="og:description"/i);
  assert.match(html, /<link[^>]+rel="icon"/i);
});

test('all target="_blank" links include rel="noopener noreferrer"', () => {
  const blankLinks = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].map((m) => m[0]);
  assert.ok(blankLinks.length >= 7, `Expected at least 7 external WA links, found ${blankLinks.length}`);
  for (const tag of blankLinks) {
    assert.match(tag, /rel="noopener noreferrer"/, `Missing rel="noopener noreferrer" on: ${tag}`);
  }
});

test('no off-brand donut or pasta Unsplash photos remain', () => {
  assert.doesNotMatch(html, /photo-1551024601-bec78aea704b/, 'Pink donut image must be removed');
  assert.doesNotMatch(html, /photo-1563379926898-05f4575a45d8/, 'Pasta image must be removed');
});

test('SITE_CONFIG and pure WhatsApp/calculator helpers work accurately', () => {
  const {
    SITE_CONFIG,
    buildWaLink,
    formatIndonesianDate,
    calculateEstimate,
    buildCalculatorMessage,
    createFallbackSvg,
  } = loadPureHelpers();

  assert.equal(SITE_CONFIG.brandName, 'Rumah Aqiqah Semarang');
  assert.equal(SITE_CONFIG.waNumber, '6285100402001');

  const link = buildWaLink('Halo tes & cek');
  assert.equal(link, 'https://wa.me/6285100402001?text=Halo%20tes%20%26%20cek');

  assert.equal(formatIndonesianDate('2026-12-10'), '10 Desember 2026');
  assert.equal(formatIndonesianDate(''), '');
  assert.equal(formatIndonesianDate('invalid'), '');

  const est = calculateEstimate('Paket Lengkap Putra', 150);
  assert.equal(est.minTotal, 2650000 + 150 * 25000);
  assert.equal(est.maxTotal, 2650000 + 150 * 32000);
  assert.match(est.label, /^Rp.*– Rp/);

  const msg = buildCalculatorMessage(SITE_CONFIG.brandName, 'Paket Lengkap Putra', 150, '2026-12-10');
  assert.equal(
    msg,
    'Halo Rumah Aqiqah Semarang, saya ingin konsultasi pesanan Paket Lengkap Putra sekitar 150 box pada tanggal 10 Desember 2026. Mohon info detail & ketersediaannya.'
  );

  const svg = createFallbackSvg('Nasi Box <Special>');
  assert.ok(svg.startsWith('data:image/svg+xml;charset=UTF-8,'));
  assert.doesNotMatch(decodeURIComponent(svg), /<Special>/);
});
