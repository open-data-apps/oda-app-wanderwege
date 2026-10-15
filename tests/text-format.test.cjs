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
