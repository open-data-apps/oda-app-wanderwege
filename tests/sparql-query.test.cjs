const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const noop = () => {};
const source = fs.readFileSync(path.join(__dirname, "../app/app.js"), "utf8");
const c = vm.createContext({ console, window: { location: { href: "https://fixture.test/app/", pathname: "/app/" }, addEventListener: noop },
  document: { addEventListener: noop, querySelector: () => null, querySelectorAll: () => [] } });
vm.runInContext(source, c);

// 1.7.8: Bei festem LIMIT mit Umkreissuche nach Entfernung des Startpunkts sortieren,
// sonst ist die geladene Auswahl zufällig.
test("Umkreissuche sortiert nach Entfernung des Startpunkts, Wege ohne Startpunkt am Ende, vor LIMIT 1000", () => {
  const q = c.buildTrailSearchSparql(47.999, 7.8421, 25);
  assert.match(q, /^PREFIX xsd: <http:\/\/www\.w3\.org\/2001\/XMLSchema#>$/m);
  assert.match(q, /\}\nORDER BY DESC\(BOUND\(\?startLat\)\) ASC\(\(xsd:double\(\?startLat\) - 47\.999\) \* \(xsd:double\(\?startLat\) - 47\.999\) \+ \(xsd:double\(\?startLon\) - 7\.8421\) \* \(xsd:double\(\?startLon\) - 7\.8421\) \* 0\.4478\)\nLIMIT 1000$/);
});

test("Hinweis bei erreichtem Limit nennt die nächstgelegenen Treffer und wechselnde Kandidaten", () => {
  assert.match(source, /die nächstgelegenen unter den Treffern, die die DZT-Umkreissuche liefert/);
  assert.match(source, /können zwischen Abrufen wechseln/);
});
