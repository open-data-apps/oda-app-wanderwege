const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

// Lädt die ausgelieferte app/app.js; nur DOM-Grenzen werden gefaked.
const noop = () => {};
const c = vm.createContext({ console, window: { location: { href: "https://fixture.test/app/", pathname: "/app/" }, addEventListener: noop },
  document: { addEventListener: noop, querySelector: () => null, querySelectorAll: () => [] } });
vm.runInContext(fs.readFileSync(path.join(__dirname, "../app/app.js"), "utf8"), c);

test("DZT-Beschreibung: **fett** wird <strong>, lose Sternchen und Überschriftenzeichen verschwinden, HTML bleibt escaped", () => {
  assert.equal(c.formatDztText("Von **Freiburg** aus"), "Von <strong>Freiburg</strong> aus");
  assert.equal(c.formatDztText("Waldkirc**\n\n**h** weiter"), "Waldkirc\n\n<strong>h</strong> weiter");
  assert.equal(c.formatDztText("### Rast am Weg"), "Rast am Weg");
  assert.equal(c.formatDztText('<img src=x onerror=alert(1)> **a**'), "&lt;img src=x onerror=alert(1)&gt; <strong>a</strong>");
});

test("Detailansicht nutzt die Formatierung", () => {
  const html = c.detailHtml({}, { name: "Weg", group: "wandern" },
    { description: "Von **Freiburg** aus", images: [], lineCoords: [], lengthKm: null });
  assert.match(html, /Von <strong>Freiburg<\/strong> aus/);
  assert.doesNotMatch(html, /\*\*/);
});

test("Einleitungssatz nennt die Kategorie grammatisch korrekt", () => {
  const el = { innerHTML: "" };
  c.renderErklaerText({ uid: "u", root: { querySelector: () => el }, config: { ort: "Freiburg", kategorie: "Fußwanderweg", radiusKm: "25" } });
  assert.match(el.innerHTML, /Diese Karte zeigt Wege der Kategorie „Fußwanderweg“ im Umkreis von 25 km um Freiburg/);
});

// Live-Befund 27.10.2026: Die DZT-Quelle liefert Zeiten, die nicht zur Länge passen
// (Werte per SPARQL geprüft, alle als HikingTrail typisiert). Geprüft werden nur reine
// Geh- und Wanderwege; Alpin-, Lauf-, Skate- und Radwege haben andere übliche Tempi.
const UNPLAUSIBEL = " (Zeitangabe der Quelle wirkt unplausibel)";
const T = (...namen) => ["https://schema.org/Place", "https://odta.io/voc/Trail", ...namen.map((n) => "https://odta.io/voc/" + n)];

test("Dauer: offensichtlich unplausible Zeiten auf Wanderwegen werden markiert, der Wert bleibt", () => {
  assert.equal(c.formatDauer("PT4H12M", 2.373, T("HikingTrail", "ThematicTrail")), "4 Std 12 Min" + UNPLAUSIBEL);
  assert.equal(c.formatDauer("PT7H", 4.12, T("HikingTrail")), "7 Std" + UNPLAUSIBEL);
  assert.equal(c.formatDauer("PT2H35M", 38.11, T("HikingTrail", "LongDistanceHikeTrail")), "2 Std 35 Min" + UNPLAUSIBEL);
  assert.equal(c.formatDauer("PT40M", 2.176, T("HikingTrail")), "40 Min");
});

test("Dauer: Alpin-, Lauf-, Skate- und Radwege sowie sonstige Wege werden nicht geprüft (Review I1)", () => {
  assert.equal(c.formatDauer("PT1H20M", 20, T("InlineSkatingTrail")), "1 Std 20 Min");
  assert.equal(c.formatDauer("PT1H30M", 15, T("TrailRunning")), "1 Std 30 Min");
  assert.equal(c.formatDauer("PT3H30M", 2.5, T("HikingTrail", "AlpineTourTrail")), "3 Std 30 Min");
  assert.equal(c.formatDauer("PT3H30M", 12, T("MountainBikeTourTrail")), "3 Std 30 Min");
  assert.equal(c.formatDauer("PT2H35M", 38.11, T("BikeTourTrail")), "2 Std 35 Min");
  assert.equal(c.formatDauer("PT7H", 4.12, T()), "7 Std");
});

test("Dauer: ohne Länge oder ohne lesbare Zeit keine Markierung", () => {
  assert.equal(c.formatDauer("PT4H12M", null, T("HikingTrail")), "4 Std 12 Min");
  assert.equal(c.formatDauer("", 3, T("HikingTrail")), "");
  assert.equal(c.formatDauer("P1DT2H", 30, T("HikingTrail")), "");
});

test("Detailansicht zeigt die Markierung", () => {
  const html = c.detailHtml({}, { name: "RK2", group: "wandern", types: T("HikingTrail") },
    { description: "", images: [], lineCoords: [], lengthKm: 4.12, durationIso: "PT7H", durationText: "7 Std" });
  assert.match(html, /7 Std \(Zeitangabe der Quelle wirkt unplausibel\)/);
});
