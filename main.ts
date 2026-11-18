// SPDX-License-Identifier: MIT
// The Global Ledger — make.fun news-image-20261118
// "Wednesday 18 November 2026 in one image" — 30 stories, drawn from scratch.
// Node 22, standard library only (node:fs, node:path, node:zlib). No network.
// Writes /output/entry.png (or $MAKEFUN_OUTPUT_DIR/entry.png locally).
// Deterministic: same bytes on every run.
//
// HOW TO REFRESH TOMORROW (19 Nov): edit ONLY the STORIES array below.
// Every headline / deck / pin lives in that one array; the drawing code
// below it never needs touching for a content refresh.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ===========================================================================
// STORIES — EDIT THIS ARRAY ONLY (refresh 19 Nov: update facts, keep shape)
// Fields: n = story number, k = kicker "REGION · THEME", h = headline,
// d = deck (1-3 short lines), t = theme key (war|pol|eco|health|sport|other),
// lon/lat = map pin (true lon/lat; "nudged" pins are shifted a few degrees
// for legibility and marked in the build log).
// Themes: war = red, pol = blue, eco = green, health = teal, sport = orange,
// other = purple. Disputed claims are attributed in the deck ("X says…").
// ===========================================================================
const STORIES = [
  // ---- 12 FEATURES (grid 4x3) ----
  { n: 1, k: 'ASIA · DIPLOMACY', h: 'Putin in Shenzhen for three-way summit',
    d: 'Arrived early for APEC; first-ever China–Russia–US summit planned.',
    t: 'pol', lon: 114.06, lat: 22.55, art: 'flags3' },
  { n: 2, k: 'EUROPE · UKRAINE WAR', h: 'Kerch Bridge span in the sea; Azov shipping blocked',
    d: 'A 227m road arch fell after a second Ukrainian strike; road and rail shut.',
    t: 'war', lon: 36.5, lat: 45.3, art: 'bridge' },
  { n: 3, k: 'ASIA · DIPLOMACY', h: 'Quad wraps in Manila; minerals pact signed',
    d: 'First Quad leaders\u2019 meeting since 2024; deals curb coercion by one supplier.',
    t: 'pol', lon: 120.98, lat: 14.6, art: 'flags4' },
  { n: 4, k: 'US · TECH', h: 'Nvidia doubles to $115.8bn; Huang stays out',
    d: 'Revenue up 103% to $115.8bn; EPS $2.68 beat estimates; Q4 guide $130bn.',
    t: 'eco', lon: -119.8, lat: 35.4, art: 'chipup' }, // pin nudged: Santa Clara area, California
  { n: 5, k: 'US · MARKETS', h: 'Dow slides 849 as AI sell-off deepens',
    d: 'Dow fell 1.64% to 50,759; S&P 500 down 1.03% to 7,340, its lowest since late July.',
    t: 'eco', lon: -74.0, lat: 40.7, art: 'chartdown' },
  { n: 6, k: 'GULF · IRAN WAR', h: 'Bahrain lifts alert; Kuwait reports intercepts',
    d: 'Bahrain lifted an overnight warning; Kuwait\u2019s army said it intercepted drones.',
    t: 'war', lon: 50.55, lat: 26.2, art: 'radar' },
  { n: 7, k: 'GULF · IRAN WAR', h: 'Tankers hit mines off Hormuz as talks open',
    d: 'Iran says tanker traffic won\u2019t return to pre-war levels; a US carrier arrived.',
    t: 'war', lon: 58.0, lat: 27.0, art: 'tanker' }, // pin nudged east into Gulf of Oman
  { n: 8, k: 'AFRICA · HEALTH', h: 'Ebola passes 11,000 cases in DR Congo',
    d: 'UN counts over 11,000 cases and 5,400 deaths; cases have doubled in three months.',
    t: 'health', lon: 23.0, lat: -2.5, art: 'medic' },
  { n: 9, k: 'ASIA · CLIMATE', h: 'Cyclone Akvan nears India\u2019s east coast',
    d: 'The Bay of Bengal storm is set to strengthen into a severe cyclone by 19 Nov.',
    t: 'health', lon: 88.0, lat: 15.0, art: 'cyclone' },
  { n: 10, k: 'US · TECH', h: 'Anthropic to price blockbuster IPO today',
    d: 'Shares priced at $70–78, offering 825m; trading as ANT on Nasdaq starts 19 Nov.',
    t: 'eco', lon: -122.42, lat: 37.77, art: 'rocket' },
  { n: 11, k: 'ASIA · POLITICS', h: 'Mongolia\u2019s president says he will step down',
    d: 'He denies a $25m rail bribe claim; parliament must approve his resignation.',
    t: 'pol', lon: 106.9, lat: 47.92, art: 'door' },
  { n: 12, k: 'AMERICAS · DIPLOMACY', h: 'Canada–China widen trade as Xi meets Carney',
    d: 'The two sides widened trade cooperation ahead of the APEC summit in Shenzhen.',
    t: 'pol', lon: 116.4, lat: 39.9, art: 'flags2' },
  // ---- 18 ALSO (one line each: place bold + short phrase) ----
  { n: 13, k: 'EUROPE · WAR', place: 'Ukraine', text: '372 killed in Oct, UN says', t: 'war', lon: 30.52, lat: 50.45 },
  { n: 14, k: 'AFRICA · WAR', place: 'Sudan', text: 'UN confirms 2,230+ deaths', t: 'war', lon: 30.0, lat: 15.0 },
  { n: 15, k: 'MIDDLE EAST · AID', place: 'Gaza', text: 'one hot meal every two days', t: 'other', lon: 34.47, lat: 31.5 },
  { n: 16, k: 'EUROPE · LAW', place: 'London', text: 'Trump BBC deposition delayed', t: 'pol', lon: -0.13, lat: 51.5 },
  { n: 17, k: 'EUROPE · FINANCE', place: 'Frankfurt', text: 'bank ignored client alerts', t: 'eco', lon: 8.68, lat: 50.11 },
  { n: 18, k: 'AMERICAS · POLITICS', place: 'St Kitts', text: 'citizenship scheme ends', t: 'pol', lon: -62.78, lat: 17.3 },
  { n: 19, k: 'ASIA · DIPLOMACY', place: 'India', text: 'Modi presses Indo-Pacific vision', t: 'pol', lon: 77.21, lat: 28.61 },
  { n: 20, k: 'AMERICAS · DIPLOMACY', place: 'Montreal', text: 'US presses UN on Taiwan', t: 'pol', lon: -73.57, lat: 45.5 },
  { n: 21, k: 'ASIA · TECH', place: 'Beijing', text: 'Baidu chief warns of AI bubble', t: 'eco', lon: 120.5, lat: 37.5 }, // pin nudged: Shandong, near Beijing
  { n: 22, k: 'ASIA · BUSINESS', place: 'India', text: 'Amazon pledges $7bn renewables', t: 'eco', lon: 80.8, lat: 25.8 }, // pin nudged: south-east of New Delhi
  { n: 23, k: 'US · ECONOMY', place: 'Washington', text: 'Fed minutes due today', t: 'eco', lon: -77.04, lat: 38.9 },
  { n: 24, k: 'EUROPE · POLITICS', place: 'Riga', text: 'Latvia approves new cabinet', t: 'pol', lon: 24.1, lat: 56.95 },
  { n: 25, k: 'US · LAW', place: 'US', text: 'Asif Merchant jailed 27.5 years', t: 'pol', lon: -80.5, lat: 36.5 }, // pin nudged: Virginia, near Washington
  { n: 26, k: 'ASIA · SPORT', place: 'Chennai', text: 'Dhoni retires from IPL', t: 'sport', lon: 80.27, lat: 13.08 },
  { n: 27, k: 'EUROPE · SPORT', place: 'Belfast', text: 'N. Ireland top Nations tier', t: 'sport', lon: -5.93, lat: 54.6 },
  { n: 28, k: 'AFRICA · ANIMALS', place: 'Cape Town', text: 'baboon move sparks protests', t: 'other', lon: 18.42, lat: -33.92 },
  { n: 29, k: 'AMERICAS · RELIGION', place: 'Peru', text: 'Pope Leo hit in eye by rosary', t: 'other', lon: -75.0, lat: -10.0 },
  { n: 30, k: 'ASIA · DIPLOMACY', place: 'Tokyo', text: 'Japan offers ASEAN energy aid', t: 'pol', lon: 139.69, lat: 35.68 },
];

const THEME = {
  war:    { c: [192, 57, 43],  tint: [243, 226, 222], name: 'War & security' },
  pol:    { c: [36, 86, 166],  tint: [226, 233, 244], name: 'Politics & law' },
  eco:    { c: [46, 125, 79],  tint: [224, 239, 228], name: 'Economy & tech' },
  health: { c: [23, 129, 126], tint: [221, 240, 238], name: 'Health & climate' },
  sport:  { c: [217, 122, 31], tint: [251, 238, 223], name: 'Sport' },
  other:  { c: [122, 95, 181], tint: [235, 231, 245], name: 'Aid & other' },
};

// ===========================================================================
// VECTOR FONT — hand-drawn bold sans (Hershey-style stroke font).
// Grid: cap height 7 units (y 0 top .. 7 baseline), x-height top 2.5,
// descenders to 9.5. Each glyph: [advance, stroke, stroke, ...];
// a stroke is "x,y x,y ..." polyline points. Rendered with round,
// thick strokes so it reads as a clean bold sans at any size.
// NO pixel font: at 300px downscale the shapes stay smooth.
// ===========================================================================
const GLYPHS = {
  'A': [6, '0,7 2.5,0 5,7', '1.3,4.6 3.7,4.6'],
  'B': [5.5, '0,0 0,7', '0,0 3.5,0 4.8,1 4.8,2.4 3.6,3.5 0,3.5', '0,3.5 3.8,3.5 5,4.6 5,6 4,7 0,7'],
  'C': [5.5, '5,1.2 4,0 1,0 0,1 0,6 1,7 4,7 5,5.8'],
  'D': [6, '0,0 0,7', '0,0 3.5,0 5,1.5 5,5.5 3.5,7 0,7'],
  'E': [5.5, '0,0 0,7', '0,0 4.8,0', '0,3.5 3.6,3.5', '0,7 4.8,7'],
  'F': [5.5, '0,0 0,7', '0,0 4.8,0', '0,3.5 3.6,3.5'],
  'G': [6, '5,1.2 4,0 1,0 0,1 0,6 1,7 4,7 5,5.8 5,3.8 2.8,3.8'],
  'H': [6, '0,0 0,7', '5,0 5,7', '0,3.5 5,3.5'],
  'I': [3.5, '0.7,0 2.8,0', '1.75,0 1.75,7', '0.7,7 2.8,7'],
  'J': [5, '4.8,0 4.8,5.8 4,7 2,7 0.8,6'],
  'K': [6, '0,0 0,7', '4.8,0 0.8,3.5 4.8,7'],
  'L': [5.5, '0,0 0,7', '0,7 4.8,7'],
  'M': [6.5, '0,7 0,0 3.25,4.2 6.5,0 6.5,7'],
  'N': [6.5, '0,7 0,0 6.5,7 6.5,0'],
  'O': [6.5, '1.2,0 5.3,0 6.5,1.2 6.5,5.8 5.3,7 1.2,7 0,5.8 0,1.2 1.2,0'],
  'P': [5.5, '0,0 0,7', '0,0 3.5,0 5,1 5,2.6 3.5,3.6 0,3.6'],
  'Q': [6.5, '1.2,0 5.3,0 6.5,1.2 6.5,5.8 5.3,7 1.2,7 0,5.8 0,1.2 1.2,0', '3.8,5 6.5,7.5'],
  'R': [6, '0,0 0,7', '0,0 3.5,0 5,1 5,2.6 3.5,3.6 0,3.6', '2.8,3.6 5.5,7'],
  'S': [5.5, '4.8,1.2 4,0 1,0 0,1 0,2.6 1,3.5 4,3.5 5,4.4 5,6 4,7 1,7 0,6'],
  'T': [6, '0,0 6,0', '3,0 3,7'],
  'U': [6, '0,0 0,5.8 1,7 5,7 6,5.8 6,0'],
  'V': [6, '0,0 3,7 6,0'],
  'W': [8, '0,0 1.4,7 4,2.2 6.6,7 8,0'],
  'X': [6, '0,0 6,7', '6,0 0,7'],
  'Y': [6, '0,0 3,3.4 6,0', '3,3.4 3,7'],
  'Z': [5.5, '0,0 5,0 0,7 5,7'],
  '0': [6.5, '1.2,0 5.3,0 6.5,1.2 6.5,5.8 5.3,7 1.2,7 0,5.8 0,1.2 1.2,0'],
  '1': [3.5, '2.4,0 2.4,7', '0.8,1.6 2.4,0', '0.5,7 4.2,7'],
  '2': [5.5, '0.6,1.6 1.2,0.4 4,0 5,1 5,2.8 0,7 5,7'],
  '3': [5.5, '0.6,0.6 2,0 4,0 5,1 5,2.6 3.4,3.5 5,3.5 5,6 4,7 2,7 0.6,6.4'],
  '4': [6, '4,0 0.5,4.8 5.5,4.8', '3.8,0 3.8,7'],
  '5': [5.5, '5,0 0,0 0,3.2 3.6,3.2 5,4.4 5,6 4,7 1,7 0,6'],
  '6': [5.5, '4.6,0.6 3,0 1,0 0,1.4 0,6 1,7 4,7 5,6 5,4.4 4,3.4 1,3.4 0,4.6'],
  '7': [5.5, '0,0 5,0 2.2,7'],
  '8': [5.5, '1,0 4,0 5,1 5,2.6 4,3.5 1,3.5 0,2.6 0,1 1,0', '1,3.5 4,3.5 5,4.4 5,6 4,7 1,7 0,6 0,4.4 1,3.5'],
  '9': [5.5, '1,0 4,0 5,1 5,2.6 4,3.5 1,3.5 0,2.6 0,1 1,0', '5,0.8 5,6 4,7 1,7 0.4,6.4'],
  'a': [5.5, '1,3 4,3 5,4 5,6 4,7 1,7 0,6 0,4 1,3', '5,2.5 5,7'],
  'b': [5.5, '0,0 0,7', '0,4.6 1,3.2 4,3.2 5,4.2 5,6 4,7 0,7'],
  'c': [5, '5,3.6 4,2.6 1,2.6 0,3.6 0,6 1,7 4,7 5,6'],
  'd': [5.5, '5,0 5,7', '0,3.6 1,2.6 4,2.6 5,3.6 5,6 4,7 1,7 0,6 0,3.6'],
  'e': [5.5, '4.6,6.2 4,7 1,7 0,6 0,4 1,2.6 4,2.6 5,3.6 5,4.8 0.4,4.8'],
  'f': [4, '3.4,0.8 2.6,0 1.4,0 0.8,1 0.8,7', '0.4,3 3.6,3'],
  'g': [5.5, '0,3.6 1,2.6 4,2.6 5,3.6 5,6 4,7 1,7 0,6 0,3.6', '5,2.6 5,8.4 4,9.4 1,9.4 0.4,8.6'],
  'h': [5.5, '0,0 0,7', '0,4.6 1,3.2 4,3.2 5,4.2 5,7'],
  'i': [2.5, '1.25,2.6 1.25,7', '1.25,0.6 1.25,1.4'],
  'j': [3, '2,2.6 2,8 1.4,9.2 0.6,9 0.4,8.4', '2,0.6 2,1.4'],
  'k': [5.5, '0,0 0,7', '4.8,2.6 0.8,5 4.8,7'],
  'l': [2.5, '1.25,0 1.25,7'],
  'm': [6.5, '0,2.6 0,7', '0,4.6 0.8,3 2.2,3 2.8,4 2.8,7', '2.8,4.6 3.6,3 5,3 5.6,4 5.6,7'],
  'n': [5.5, '0,2.6 0,7', '0,4.6 1,3 4,3 5,4 5,7'],
  'o': [5.5, '1,2.6 4,2.6 5,3.6 5,6 4,7 1,7 0,6 0,3.6 1,2.6'],
  'p': [5.5, '0,2.6 0,9.4', '0,4.6 1,3.2 4,3.2 5,4.2 5,6 4,7 0,7'],
  'q': [5.5, '0,3.6 1,2.6 4,2.6 5,3.6 5,6 4,7 1,7 0,6 0,3.6', '5,2.6 5,9.4'],
  'r': [4.5, '0,2.6 0,7', '0,4.6 1,3 3,3 3.8,3.8 4.2,5'],
  's': [5, '4.4,3.6 3.8,2.6 1.2,2.6 0.4,3.4 0.4,4.4 1,5.2 3.6,5.2 4.6,6 4.6,6.6 3.8,7 1.2,7 0.4,6.2'],
  't': [4, '2,0.6 2,7 3.2,7', '0.4,3 3.6,3'],
  'u': [5.5, '0,2.6 0,6 1,7 4,7 5,6 5,2.6'],
  'v': [5.5, '0,2.6 2.75,7 5.5,2.6'],
  'w': [8, '0,2.6 1.4,7 4,3.8 6.6,7 8,2.6'],
  'x': [5.5, '0,2.6 5.5,7', '5.5,2.6 0,7'],
  'y': [5.5, '0,2.6 2.75,7 5.5,2.6', '2.75,7 2.75,8.6 2,9.4 1,9.4'],
  'z': [5, '0,2.6 5,2.6 0,7 5,7'],
  '.': [2.5, '1.25,6.4 1.25,7'],
  ',': [2.5, '1.25,6.4 1.25,7', '1.25,7 0.6,8.6'],
  ':': [2.5, '1.25,2.6 1.25,3.4', '1.25,6 1.25,6.8'],
  ';': [2.5, '1.25,2.6 1.25,3.4', '1.25,6 1.25,6.8', '1.25,6.8 0.6,8.4'],
  '!': [2.5, '1.25,0 1.25,5', '1.25,6.2 1.25,7'],
  '?': [5, '1,1.6 1.4,0.6 3.4,0 4.4,0.8 4.4,2.2 3.4,3.4 2.2,3.4 2.2,4.6', '2.2,6.2 2.2,7'],
  "'": [2.5, '1.6,0 1,2'],
  '"': [4.5, '1.4,0 0.8,2', '3.6,0 3,2'],
  '-': [4.5, '0.4,4.6 4.1,4.6'],
  '–': [6, '0.4,4.6 5.6,4.6'],
  '—': [8, '0.4,4.6 7.6,4.6'],
  '(': [4, '3.2,0.4 1.6,2 1.6,5 3.2,6.6'],
  ')': [4, '0.8,0.4 2.4,2 2.4,5 0.8,6.6'],
  '/': [4.5, '3.8,0 0.7,7'],
  '$': [5.5, '2.75,-0.8 2.75,7.8', '4.8,1.2 4,0 1,0 0,1 0,2.6 1,3.5 4,3.5 5,4.4 5,6 4,7 1,7 0,6'],
  '%': [8, '6.6,0.4 0.8,7', '0.6,1.4 2,0.4 3,1.2 3,2.4 2,3.4 0.8,3.2 0.4,2.2 0.6,1.4', '5,4 6.4,3.6 7.4,4.4 7.4,5.6 6.4,6.6 5,6.4 4.6,5.4 5,4'],
  '&': [6, '4.8,1 4,0 1.5,0 0.5,1 0.5,2.5 2,3.5 5,3.5 5,5.5 4,7 1,7 0,6', '5,3.5 1,7'],
  '+': [5.5, '0.6,3.5 4.9,3.5', '2.75,0.8 2.75,6.2'],
  '=': [5.5, '0.6,2.4 4.9,2.4', '0.6,5 4.9,5'],
  '·': [2.5, '1.25,3.4 1.25,4.2'],
  '•': [3, '1.5,3.2 1.5,4.4'],
  ' ': [3],
};
// Curly quotes / apostrophes map to the straight ones.
GLYPHS['’'] = GLYPHS["'"]; GLYPHS['‘'] = GLYPHS["'"];
GLYPHS['“'] = GLYPHS['"']; GLYPHS['”'] = GLYPHS['"'];

// ===========================================================================
// CANVAS + PRIMITIVES (pure RGB buffer, no dependencies)
// ===========================================================================
const W = 1024, H = 1024;
const buf = new Uint8Array(W * H * 3);

function rgb(c) { return c; } // colors are [r,g,b] arrays
function setPx(x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2];
}
function fillRect(x, y, w, h, c) {
  const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(W, Math.round(x + w)), y1 = Math.min(H, Math.round(y + h));
  for (let yy = y0; yy < y1; yy++) {
    let i = (yy * W + x0) * 3;
    for (let xx = x0; xx < x1; xx++, i += 3) { buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; }
  }
}
function fillCircle(cx, cy, r, c) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r2) setPx(x, y, c);
    }
  }
}
function ring(cx, cy, r, w, c) {
  const ro = r + w / 2, ri = Math.max(0, r - w / 2);
  for (let y = Math.floor(cy - ro); y <= Math.ceil(cy + ro); y++) {
    for (let x = Math.floor(cx - ro); x <= Math.ceil(cx + ro); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d2 = dx * dx + dy * dy;
      if (d2 <= ro * ro && d2 >= ri * ri) setPx(x, y, c);
    }
  }
}
// Thick line with round caps: stamp circles along the segment.
function thickLine(x0, y0, x1, y1, w, c) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
  const r = w / 2;
  if (len < 0.01) { fillCircle(x0, y0, r, c); return; }
  const steps = Math.max(1, Math.ceil(len / Math.max(0.5, r * 0.7)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    fillCircle(x0 + dx * t, y0 + dy * t, r, c);
  }
}
function polyline(pts, w, c, closed) {
  for (let i = 0; i + 1 < pts.length; i++) thickLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w, c);
  if (closed && pts.length > 2) thickLine(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1], w, c);
}
// Scanline polygon fill (even-odd), pts = [[x,y],...]
function fillPoly(pts, c) {
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= y + 0.5 && b[1] > y + 0.5) || (b[1] <= y + 0.5 && a[1] > y + 0.5)) {
        xs.push(a[0] + (y + 0.5 - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) setPx(x, y, c);
    }
  }
}
function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

// ===========================================================================
// TEXT ENGINE — draws the vector font.
// size = cap height in px. weight = stroke width in font units.
// scaleX = horizontal condense (1 = normal). tracking = extra px per char.
// slant = italic shear (0 = upright). Baseline y = baseline of caps.
// ===========================================================================
function glyphOf(ch) { return GLYPHS[ch] || GLYPHS['?']; }
function textWidth(str, size, o) {
  const s = size / 7, sx = (o && o.scaleX) || 1, tr = (o && o.tracking) || 0;
  let w = 0;
  for (const ch of str) w += (glyphOf(ch)[0] * s * sx + tr);
  return w - (str.length ? tr : 0);
}
function drawText(str, x, yBase, size, color, o) {
  o = o || {};
  const s = size / 7, sx = o.scaleX || 1, tr = o.tracking || 0;
  const wUnits = o.weight || 1.2, slant = o.slant || 0;
  const wPx = Math.max(0.9, wUnits * s);
  let cx = x;
  for (const ch of str) {
    const g = glyphOf(ch);
    for (let si = 1; si < g.length; si++) {
      const raw = g[si].split(' ');
      const pts = raw.map(p => {
        const [gx, gy] = p.split(',').map(Number);
        return [cx + (gx * sx + slant * (7 - gy)) * s, yBase - (7 - gy) * s];
      });
      polyline(pts, wPx, color, false);
    }
    cx += g[0] * s * sx + tr;
  }
  return cx;
}
function wrapText(str, maxW, size, o) {
  const words = str.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  for (const wd of words) {
    const trial = cur ? cur + ' ' + wd : wd;
    if (textWidth(trial, size, o) <= maxW || !cur) cur = trial;
    else { lines.push(cur); cur = wd; }
  }
  if (cur) lines.push(cur);
  return lines;
}
// Fit text into maxW x (maxLines * lineH): shrink size until it fits.
function fitBlock(str, maxW, size0, maxLines, lineH, o) {
  let size = size0;
  let lines = wrapText(str, maxW, size, o);
  while (lines.length > maxLines && size > 7) {
    size *= 0.94;
    lines = wrapText(str, maxW, size, o);
  }
  return { lines, size };
}

// ===========================================================================
// PNG ENCODER (RGB, filter 0, zlib) — written from scratch.
// ===========================================================================
function crc32(data) {
  let table = crc32.t;
  if (!table) {
    table = crc32.t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c;
    }
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) c = table[(c ^ data[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}
function encodePNG() {
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0;
    raw.set(buf.subarray(y * W * 3, (y + 1) * W * 3), y * (W * 3 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ===========================================================================
// FLAGS + FLAT ILLUSTRATIONS (simple geometric shapes, NO text inside)
// ===========================================================================
const INK = [30, 28, 25];
function drawFlag(x, y, w, h, kind) {
  // pole
  thickLine(x - 2, y + h + 12, x - 2, y - 4, 2, [110, 104, 90]);
  fillCircle(x - 2, y - 5, 2, [190, 160, 60]);
  const bands = (colors) => {
    for (let i = 0; i < colors.length; i++)
      fillRect(x, y + (h / colors.length) * i, w, h / colors.length + 0.5, colors[i]);
  };
  if (kind === 'cn') {
    fillRect(x, y, w, h, [222, 41, 16]);
    fillCircle(x + 8, y + 8, 3, [255, 222, 0]);
    fillCircle(x + 16, y + 6, 1.5, [255, 222, 0]); fillCircle(x + 19, y + 11, 1.5, [255, 222, 0]);
    fillCircle(x + 16, y + 15, 1.5, [255, 222, 0]); fillCircle(x + 11, y + 14, 1.5, [255, 222, 0]);
  } else if (kind === 'us') {
    for (let i = 0; i < 7; i++) fillRect(x, y + (h / 7) * i, w, h / 7 + 0.5, i % 2 ? [255, 255, 255] : [190, 40, 50]);
    fillRect(x, y, w * 0.42, h * 0.55, [40, 60, 140]);
    for (const [dx, dy] of [[5, 4], [12, 4], [5, 9], [12, 9]]) fillCircle(x + dx, y + dy, 1, [255, 255, 255]);
  } else if (kind === 'ru') bands([[255, 255, 255], [40, 80, 180], [210, 40, 40]]);
  else if (kind === 'jp') {
    fillRect(x, y, w, h, [250, 250, 250]);
    fillCircle(x + w / 2, y + h / 2, h * 0.3, [190, 40, 50]);
  } else if (kind === 'in') {
    bands([[255, 153, 51], [255, 255, 255], [20, 130, 60]]);
    fillCircle(x + w / 2, y + h / 2, 2.5, [30, 60, 140]);
  } else if (kind === 'au') {
    fillRect(x, y, w, h, [30, 60, 140]);
    for (const [dx, dy] of [[6, 5], [16, 6], [26, 5], [10, 14], [22, 15]]) fillCircle(x + dx, y + dy, 1.5, [255, 255, 255]);
  } else if (kind === 'ca') {
    fillRect(x, y, w / 4, h, [210, 40, 40]); fillRect(x + w / 4, y, w / 2, h, [255, 255, 255]);
    fillRect(x + (3 * w) / 4, y, w / 4, h, [210, 40, 40]);
    fillCircle(x + w / 2, y + h / 2, 3, [210, 40, 40]);
  } else if (kind === 'ph') {
    fillRect(x, y, w, h / 2, [40, 90, 180]); fillRect(x, y + h / 2, w, h / 2, [210, 40, 40]);
    fillPoly([[x, y], [x, y + h], [x + w * 0.42, y + h / 2]], [255, 255, 255]);
    fillCircle(x + w * 0.2, y + h / 2, 2, [255, 222, 0]);
  } else if (kind === 'mn') {
    fillRect(x, y, w / 3, h, [200, 40, 40]); fillRect(x + w / 3, y, w / 3, h, [30, 80, 180]);
    fillRect(x + (2 * w) / 3, y, w / 3, h, [200, 40, 40]);
    fillCircle(x + w / 2, y + h / 2, 2.5, [255, 222, 0]);
  }
}
function tableTop(bx, by, bw) {
  fillPoly([[bx + 34, by + 48], [bx + bw - 34, by + 48], [bx + bw - 44, by + 57], [bx + 44, by + 57]], [150, 110, 70]);
}
function drawArt(kind, bx, by, bw) {
  const bh = 62, cx = bx + bw / 2;
  if (kind === 'flags3') {
    drawFlag(bx + 30, by + 10, 42, 26, 'cn'); drawFlag(bx + 96, by + 10, 42, 26, 'us'); drawFlag(bx + 162, by + 10, 42, 26, 'ru');
    tableTop(bx, by, bw);
  } else if (kind === 'flags4') {
    drawFlag(bx + 16, by + 10, 40, 25, 'us'); drawFlag(bx + 68, by + 10, 40, 25, 'jp');
    drawFlag(bx + 120, by + 10, 40, 25, 'in'); drawFlag(bx + 172, by + 10, 40, 25, 'au');
    tableTop(bx, by, bw);
  } else if (kind === 'flags2') {
    drawFlag(bx + 42, by + 10, 52, 30, 'ca'); drawFlag(bx + 138, by + 10, 52, 30, 'cn');
    tableTop(bx, by, bw);
  } else if (kind === 'bridge') {
    fillRect(bx, by + 44, bw, 14, [120, 170, 205]);
    fillRect(bx + 8, by + 26, 84, 6, [90, 85, 80]); fillRect(bx + 142, by + 26, 84, 6, [90, 85, 80]);
    thickLine(bx + 20, by + 26, bx + 20, by + 8, 3, [90, 85, 80]);
    thickLine(bx + 180, by + 26, bx + 180, by + 8, 3, [90, 85, 80]);
    polyline([[bx + 92, by + 32], [bx + 117, by + 52], [bx + 142, by + 32]], 5, [90, 85, 80], false);
    fillCircle(bx + 100, by + 20, 6, [170, 170, 165]); fillCircle(bx + 110, by + 14, 7, [185, 185, 180]);
    fillCircle(bx + 117, by + 30, 5, [240, 120, 30]); fillCircle(bx + 117, by + 30, 2.5, [250, 200, 60]);
    thickLine(bx + 60, by + 50, bx + 84, by + 50, 2, [255, 255, 255]);
    thickLine(bx + 150, by + 54, bx + 176, by + 54, 2, [255, 255, 255]);
  } else if (kind === 'chipup') {
    fillRect(cx - 62, by + 14, 46, 34, [30, 100, 65]);
    fillRect(cx - 52, by + 24, 26, 14, [120, 200, 150]);
    for (let i = 0; i < 3; i++) {
      thickLine(cx - 62, by + 20 + i * 11, cx - 68, by + 20 + i * 11, 2, [30, 100, 65]);
      thickLine(cx - 16, by + 20 + i * 11, cx - 10, by + 20 + i * 11, 2, [30, 100, 65]);
    }
    const bx0 = cx + 8;
    fillRect(bx0, by + 36, 12, 12, [46, 160, 90]); fillRect(bx0 + 16, by + 28, 12, 20, [46, 160, 90]);
    fillRect(bx0 + 32, by + 18, 12, 30, [46, 160, 90]);
    polyline([[bx0 - 2, by + 30], [bx0 + 22, by + 20], [bx0 + 44, by + 8]], 3, [20, 120, 60], false);
    fillPoly([[bx0 + 44, by + 8], [bx0 + 34, by + 10], [bx0 + 42, by + 18]], [20, 120, 60]);
  } else if (kind === 'chartdown') {
    fillRect(cx - 30, by + 34, 12, 16, [200, 200, 195]); fillRect(cx - 12, by + 26, 12, 24, [200, 200, 195]);
    fillRect(cx + 6, by + 18, 12, 32, [200, 200, 195]);
    polyline([[cx - 70, by + 12], [cx - 30, by + 22], [cx + 10, by + 32], [cx + 62, by + 50]], 4, [192, 57, 43], false);
    fillPoly([[cx + 62, by + 50], [cx + 50, by + 46], [cx + 58, by + 58]], [192, 57, 43]);
  } else if (kind === 'radar') {
    const rx = bx + 72, ry = by + 32;
    ring(rx, ry, 24, 2, [23, 129, 126]); ring(rx, ry, 16, 2, [23, 129, 126]); ring(rx, ry, 8, 2, [23, 129, 126]);
    fillPoly([[rx, ry], [rx + 22, ry - 8], [rx + 16, ry + 10]], [120, 210, 205]);
    fillCircle(rx + 12, ry - 12, 2.5, [192, 57, 43]); fillCircle(rx - 10, ry + 8, 2.5, [192, 57, 43]);
    const dx = bx + 168, dy = by + 26;
    fillPoly([[dx - 16, dy - 4], [dx + 2, dy - 2], [dx + 16, dy + 2], [dx + 2, dy + 2], [dx - 2, dy + 6], [dx - 8, dy + 2]], [60, 60, 70]);
    fillCircle(dx - 2, dy, 3.5, [60, 60, 70]);
  } else if (kind === 'tanker') {
    fillRect(bx, by + 46, bw, 12, [120, 170, 205]);
    fillPoly([[bx + 28, by + 34], [bx + 196, by + 34], [bx + 184, by + 50], [bx + 42, by + 50]], [70, 70, 80]);
    fillRect(bx + 52, by + 24, 34, 10, [90, 90, 100]); fillRect(bx + 150, by + 20, 16, 14, [180, 60, 50]);
    fillCircle(bx + 158, by + 12, 5, [170, 170, 165]); fillCircle(bx + 168, by + 8, 6, [185, 185, 180]);
    fillCircle(bx + 60, by + 54, 3, [40, 40, 50]); fillCircle(bx + 170, by + 56, 3, [40, 40, 50]);
    thickLine(bx + 100, by + 52, bx + 122, by + 52, 2, [255, 255, 255]);
  } else if (kind === 'medic') {
    fillCircle(bx + 62, by + 31, 20, [23, 129, 126]);
    fillRect(bx + 56, by + 18, 12, 26, [255, 255, 255]); fillRect(bx + 49, by + 25, 26, 12, [255, 255, 255]);
    const px = bx + 150, py = by + 31;
    fillCircle(px - 14, py, 9, [240, 120, 60]); fillCircle(px + 14, py, 9, [255, 255, 255]);
    ring(px + 14, py, 9, 1.5, [200, 200, 195]);
    fillRect(px - 14, py - 9, 28, 18, [240, 120, 60]);
    fillRect(px, py - 9, 14, 18, [255, 255, 255]);
  } else if (kind === 'cyclone') {
    fillRect(bx, by + 46, bw, 12, [110, 165, 205]);
    const sx = bx + 110, sy = by + 26;
    ring(sx, sy, 18, 3, [23, 129, 126]); ring(sx, sy, 11, 3, [23, 129, 126]);
    fillCircle(sx, sy, 4, [23, 129, 126]);
    thickLine(sx - 34, sy + 14, sx - 26, sy + 6, 3, [23, 129, 126]);
    thickLine(sx + 30, sy - 12, sx + 38, sy - 4, 3, [23, 129, 126]);
    for (const [rx2, ry2] of [[bx + 30, by + 14], [bx + 44, by + 10], [bx + 190, by + 14], [bx + 202, by + 10]]) {
      thickLine(rx2, ry2, rx2, ry2 + 7, 2, [120, 170, 205]);
    }
  } else if (kind === 'rocket') {
    const rx = bx + 78, ry = by + 30;
    fillPoly([[rx, ry - 20], [rx + 9, ry + 2], [rx + 9, ry + 12], [rx - 9, ry + 12], [rx - 9, ry + 2]], [240, 240, 235]);
    fillPoly([[rx, ry - 20], [rx + 6, ry - 8], [rx - 6, ry - 8]], [192, 57, 43]);
    fillPoly([[rx - 9, ry + 8], [rx - 17, ry + 18], [rx - 9, ry + 14]], [192, 57, 43]);
    fillPoly([[rx + 9, ry + 8], [rx + 17, ry + 18], [rx + 9, ry + 14]], [192, 57, 43]);
    fillCircle(rx, ry - 2, 3.5, [40, 90, 180]);
    fillPoly([[rx - 5, ry + 13], [rx + 5, ry + 13], [rx, ry + 26]], [240, 140, 40]);
    fillRect(bx + 150, by + 36, 10, 14, [46, 160, 90]); fillRect(bx + 164, by + 28, 10, 22, [46, 160, 90]);
    fillRect(bx + 178, by + 20, 10, 30, [46, 160, 90]);
  } else if (kind === 'door') {
    thickLine(bx + 48, by + 10, bx + 48, by + 54, 3, [90, 85, 80]);
    thickLine(bx + 92, by + 10, bx + 92, by + 54, 3, [90, 85, 80]);
    thickLine(bx + 48, by + 10, bx + 92, by + 10, 3, [90, 85, 80]);
    fillPoly([[bx + 52, by + 14], [bx + 74, by + 14], [bx + 66, by + 50], [bx + 52, by + 50]], [200, 195, 185]);
    fillCircle(bx + 122, by + 22, 5, [36, 86, 166]);
    polyline([[bx + 122, by + 28], [bx + 122, by + 44], [bx + 112, by + 54], [bx + 122, by + 44], [bx + 132, by + 54]], 3, [36, 86, 166], false);
    polyline([[bx + 140, by + 34], [bx + 178, by + 34]], 4, [46, 125, 79], false);
    fillPoly([[bx + 178, by + 34], [bx + 166, by + 27], [bx + 166, by + 41]], [46, 125, 79]);
  }
}

// ===========================================================================
// WORLD MAP — simplified continent outlines in lon/lat, drawn as dots.
// ===========================================================================
const CONTINENTS = [
  // Americas
  [[-168, 66], [-155, 58], [-140, 60], [-130, 54], [-125, 49], [-124, 40], [-120, 34], [-114, 29], [-110, 24], [-105, 20], [-97, 16], [-92, 15], [-86, 12], [-83, 9], [-79, 9], [-77, 4], [-80, -3], [-81, -6], [-77, -12], [-72, -18], [-70, -23], [-70, -30], [-73, -37], [-73, -44], [-74, -50], [-70, -54], [-66, -55], [-68, -50], [-65, -45], [-62, -40], [-58, -34], [-52, -32], [-48, -28], [-41, -23], [-35, -9], [-35, -6], [-40, -3], [-44, -2], [-50, 0], [-53, 4], [-60, 8], [-68, 11], [-72, 12], [-77, 10], [-87, 21], [-90, 21], [-91, 19], [-94, 19], [-97, 26], [-93, 30], [-89, 30], [-84, 30], [-81, 26], [-80, 32], [-76, 35], [-75, 38], [-74, 40], [-70, 42], [-68, 44], [-65, 44], [-60, 46], [-55, 47], [-60, 52], [-64, 58], [-68, 58], [-72, 62], [-78, 62], [-85, 66], [-92, 66], [-95, 69], [-110, 68], [-125, 70], [-140, 70], [-155, 71], [-165, 68]],
  // Greenland
  [[-58, 64], [-52, 60], [-44, 60], [-40, 64], [-32, 68], [-22, 70], [-25, 74], [-35, 76], [-50, 76], [-58, 74]],
  // Eurasia
  [[-10, 36], [-9, 43], [-2, 48], [-5, 50], [-1, 49], [2, 51], [4, 53], [8, 57], [10, 59], [6, 62], [12, 65], [18, 69], [25, 71], [30, 70], [35, 68], [42, 68], [48, 68], [55, 68], [62, 69], [68, 73], [75, 73], [80, 73], [90, 75], [100, 77], [110, 74], [120, 73], [130, 72], [140, 72], [150, 70], [158, 69], [162, 66], [170, 66], [178, 65], [178, 62], [170, 60], [162, 56], [158, 52], [156, 51], [150, 59], [142, 53], [141, 50], [141, 45], [135, 43], [130, 42], [127, 40], [126, 38], [122, 37], [120, 35], [122, 32], [120, 28], [118, 25], [110, 20], [108, 18], [105, 10], [103, 8], [100, 7], [98, 10], [97, 15], [94, 17], [92, 21], [89, 22], [86, 20], [80, 15], [77, 8], [75, 12], [73, 16], [70, 20], [66, 25], [61, 25], [57, 26], [54, 26], [51, 27], [48, 29], [50, 26], [54, 24], [57, 23], [59, 22], [55, 17], [51, 14], [45, 12], [43, 12], [41, 16], [39, 21], [37, 25], [35, 29], [34, 31], [36, 36], [30, 36], [27, 37], [26, 38], [23, 36], [22, 37], [19, 40], [15, 44], [12, 44], [8, 44], [3, 43], [-1, 44], [-2, 47], [-5, 48], [-10, 48], [-10, 43], [-9, 38]],
  // Africa
  [[-6, 35], [-10, 31], [-15, 27], [-17, 21], [-17, 15], [-16, 12], [-13, 8], [-8, 5], [-4, 5], [2, 6], [6, 4], [9, 4], [9, 0], [12, -5], [13, -10], [12, -17], [14, -22], [16, -28], [20, -34], [26, -34], [32, -28], [35, -24], [40, -16], [40, -10], [42, -4], [46, -1], [51, 2], [51, 10], [48, 11], [44, 11], [40, 15], [39, 20], [37, 22], [35, 28], [32, 31], [30, 32], [22, 33], [15, 32], [11, 34], [10, 37], [5, 37], [0, 36]],
  // Australia
  [[113, -22], [114, -30], [115, -33], [118, -35], [124, -33], [129, -32], [132, -32], [135, -35], [138, -35], [140, -38], [145, -38], [150, -37], [153, -32], [153, -27], [150, -23], [146, -19], [142, -15], [142, -11], [137, -12], [135, -12], [132, -11], [130, -13], [126, -14], [122, -17], [118, -20]],
  // UK, Iceland, Madagascar, New Guinea, Borneo, Sumatra, Java, Japan, NZ, Cuba, Sri Lanka, Taiwan
  [[-5, 50], [-3, 53], [-5, 56], [-3, 58], [-1, 57], [0, 53], [1, 51], [-1, 50]],
  [[-22, 64], [-18, 63], [-14, 64], [-15, 66], [-20, 66], [-24, 65]],
  [[44, -16], [47, -15], [50, -16], [49, -20], [45, -25], [43, -22], [43, -18]],
  [[131, -1], [136, -2], [141, -3], [146, -6], [150, -8], [147, -9], [142, -8], [138, -7], [134, -4]],
  [[109, 1], [113, 4], [117, 6], [119, 1], [117, -3], [113, -3], [110, -1]],
  [[95, 5], [100, 0], [104, -3], [106, -6], [102, -5], [98, -1]],
  [[105, -6], [110, -7], [114, -8], [114, -7], [108, -6]],
  [[130, 31], [133, 34], [136, 35], [139, 35], [141, 39], [141, 42], [143, 44], [145, 44], [142, 42], [140, 38], [137, 37], [133, 35]],
  [[167, -45], [170, -43], [173, -41], [175, -38], [177, -38], [174, -41], [172, -43], [168, -46]],
  [[-74, 20], [-77, 21], [-80, 23], [-84, 22], [-80, 22], [-77, 20]],
  [[80, 6], [81, 8], [80, 9], [79, 8]],
  [[120, 22], [121, 24], [122, 25], [121, 23]],
];
const MAP = { x0: 28, x1: 488, y0: 812, y1: 938, latTop: 72, latBot: -56 };
function proj(lon, lat) {
  return [
    MAP.x0 + ((lon + 180) * (MAP.x1 - MAP.x0)) / 360,
    MAP.y0 + ((MAP.latTop - lat) * (MAP.y1 - MAP.y0)) / (MAP.latTop - MAP.latBot),
  ];
}
function drawMap() {
  const polysPx = CONTINENTS.map(poly => poly.map(([lo, la]) => proj(lo, la)));
  const dotC = [150, 145, 132];
  for (let y = MAP.y0 + 2; y <= MAP.y1; y += 4.5) {
    for (let x = MAP.x0 + 2; x <= MAP.x1; x += 4.5) {
      for (const poly of polysPx) {
        if (pointInPoly(x, y, poly)) { fillCircle(x, y, 1.7, dotC); break; }
      }
    }
  }
  // Pins: circles first, numbers on top (clusters stay readable).
  for (const s of STORIES) {
    const [px, py] = proj(s.lon, s.lat);
    fillCircle(px, py, 6.5, THEME[s.t].c);
    ring(px, py, 6.5, 1.2, [255, 255, 255]);
  }
  for (const s of STORIES) {
    const [px, py] = proj(s.lon, s.lat);
    const num = String(s.n);
    const sz = num.length > 1 ? 8 : 9;
    const w = textWidth(num, sz, { weight: 1.5 });
    drawText(num, px - w / 2, py + sz * 0.32, sz, [255, 255, 255], { weight: 1.5 });
  }
}

// ===========================================================================
// LAYOUT — Daily Meridian template: masthead / navy date / gold strip /
// 4x3 illustrated grid / map + ALSO / footer.
// ===========================================================================
const NAVY = [22, 32, 58];
const GOLD = [198, 162, 44];
const CREAM = [246, 241, 230];
const CELLBG = [255, 253, 248];
const HAIR = [216, 210, 192];

function drawCentered(str, cx, yBase, size, color, o) {
  const w = textWidth(str, size, o);
  drawText(str, cx - w / 2, yBase, size, color, o);
}

function build() {
  fillRect(0, 0, W, H, CREAM);

  // 1. Masthead: paper name left, tagline right (italic, thin).
  drawText('THE GLOBAL LEDGER', 28, 40, 30, [28, 28, 28], { weight: 1.5, tracking: 0.5 });
  const tag = 'One day. Every continent. One page.';
  drawText(tag, 996 - textWidth(tag, 15, { weight: 0.9, slant: 0.16 }), 38, 15, [90, 85, 75], { weight: 0.9, slant: 0.16 });

  // 2. Navy bar: date huge, gold strip line below it.
  fillRect(28, 52, 968, 82, NAVY);
  drawCentered('WEDNESDAY 18 NOVEMBER 2026', 512, 108, 40, [255, 255, 255], { weight: 2.1, scaleX: 0.8, tracking: 1 });
  drawCentered('30 STORIES · 6 CONTINENTS · ONE DAY', 512, 128, 13, GOLD, { weight: 1.6, tracking: 2.5 });

  // 3. Grid 4x3 = 12 features.
  const gx0 = 28, gy0 = 144, colW = (968 - 30) / 4, rowH = 204, gut = 10;
  for (let i = 0; i < 12; i++) {
    const s = STORIES[i];
    const cx0 = gx0 + (i % 4) * (colW + gut);
    const cy0 = gy0 + Math.floor(i / 4) * (rowH + gut);
    const th = THEME[s.t];
    fillRect(cx0, cy0, colW, rowH, CELLBG);
    fillRect(cx0, cy0, colW, 1, HAIR); fillRect(cx0, cy0 + rowH - 1, colW, 1, HAIR);
    fillRect(cx0, cy0, 1, rowH, HAIR); fillRect(cx0 + colW - 1, cy0, 1, rowH, HAIR);
    // illustration band
    fillRect(cx0, cy0, colW, 58, th.tint);
    drawArt(s.art, cx0, cy0, colW);
    // number badge
    const bx = cx0 + 17, by = cy0 + 58 + 13;
    fillCircle(bx, by, 11, th.c);
    ring(bx, by, 11, 1.2, [255, 255, 255]);
    const num = String(s.n);
    drawText(num, bx - textWidth(num, 13, { weight: 1.6 }) / 2, by + 4.5, 13, [255, 255, 255], { weight: 1.6 });
    // kicker
    drawText(s.k, cx0 + 34, cy0 + 58 + 17, 10.5, th.c, { weight: 1.8, scaleX: 0.88, tracking: 0.3 });
    // headline (auto-fit to 3 lines)
    const hb = fitBlock(s.h, colW - 24, 19, 3, 22, { weight: 1.55, scaleX: 0.92 });
    let hy = cy0 + 58 + 36;
    for (const ln of hb.lines) { drawText(ln, cx0 + 12, hy, hb.size, INK, { weight: 1.55, scaleX: 0.92 }); hy += 22; }
    // deck (auto-fit to 3 lines)
    const db = fitBlock(s.d, colW - 24, 11, 3, 13.5, { weight: 1.3, scaleX: 0.95 });
    let dy = cy0 + 58 + 36 + hb.lines.length * 22 + 11;
    for (const ln of db.lines) { drawText(ln, cx0 + 12, dy, db.size, [85, 82, 75], { weight: 1.3, scaleX: 0.95 }); dy += 13.5; }
  }

  // 4. Bottom band headers + rule.
  drawText('WHERE IT HAPPENED · NUMBERS MATCH STORIES', 28, 802, 11, INK, { weight: 1.6, tracking: 0.5 });
  drawText('ALSO ON 18 NOVEMBER · 13–30', 500, 802, 11, INK, { weight: 1.6, tracking: 0.5 });
  fillRect(28, 808, 968, 1, HAIR);

  // 5. Map + legend.
  drawMap();
  const legend = ['war', 'pol', 'eco', 'health', 'sport', 'other'];
  let lx = 28;
  for (const key of legend) {
    fillCircle(lx + 3.5, 951, 3.5, THEME[key].c);
    lx += 10;
    lx = drawText(THEME[key].name, lx, 954, 8, [70, 66, 58], { weight: 1.2, scaleX: 0.85 });
    lx += 9;
  }

  // 6. ALSO list: 2 columns x 9 rows.
  for (let i = 12; i < 30; i++) {
    const s = STORIES[i];
    const col = Math.floor((i - 12) / 9), row = (i - 12) % 9;
    const ax = 500 + col * 254, ay = 816 + row * 14.5;
    const th = THEME[s.t];
    let x = ax;
    x = drawText(String(s.n), x, ay, 9.5, th.c, { weight: 1.5 }) + 5;
    x = drawText(s.place + ':', x, ay, 9.5, INK, { weight: 1.5 }) + 4;
    drawText(s.text, x, ay, 9.5, [70, 66, 58], { weight: 1.1 });
  }

  // 7. Footer.
  fillRect(28, 972, 968, 1, [200, 194, 178]);
  drawCentered('Every story happened or was first reported on Wednesday 18 November 2026. Disputed claims are attributed.', 512, 988, 10, INK, { weight: 1.2 });
  drawCentered('Sources: AP, Reuters, AFP, BBC, Al Jazeera, The Guardian, CNBC', 512, 1002, 9, [110, 105, 95], { weight: 1.1 });
}

build();
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), encodePNG());
