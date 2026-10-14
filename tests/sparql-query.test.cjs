const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const noop = () => {};
const source = fs.readFileSync(path.join(__dirname, "../app/app.js"), "utf8");
const c = vm.createContext({ console, AbortController, window: { location: { href: "https://fixture.test/app/", pathname: "/app/" }, addEventListener: noop },
  document: { addEventListener: noop, querySelector: () => null, querySelectorAll: () => [] } });
vm.runInContext(source, c);

// 1.7.9: Je Weg aggregiert (GROUP BY ?id), damit LIMIT Wege statt Zeilen zählt; die
// Kategorie steckt in der Abfrage; Sortierung nach Startpunkt mit COALESCE (fehlende und
// nicht numerische Koordinaten ans Ende).
test("Wegsuche aggregiert je Weg, sortiert per COALESCE nach Startpunkt, LIMIT 500 Wege", () => {
  const q = c.buildTrailSearchSparql(47.999, 7.8421, 25, "wandern");
  assert.match(q, /^PREFIX xsd: <http:\/\/www\.w3\.org\/2001\/XMLSchema#>$/m);
  // Umkreissuche als Unterabfrage vor der Prüfung der Trail-Spezifikation (Muster oda-sehenswuerdigkeiten)
  const sub = q.indexOf("{ SELECT DISTINCT ?geoent WHERE {");
  assert.ok(sub > 0 && sub < q.indexOf("con:entities ?geoent") && q.indexOf("con:entities ?geoent") < q.indexOf("ds:compliesWith"));
  assert.match(q, /\(SAMPLE\(\?sLat\) AS \?startLat\)/);
  assert.match(q, /\(SAMPLE\(\?sLon\) AS \?startLon\)/);
  assert.match(q, /\(GROUP_CONCAT\(DISTINCT STR\(\?typeVal\); separator=" "\) AS \?types\)/);
  assert.match(q, /\nGROUP BY \?id\nORDER BY ASC\(COALESCE\(\(xsd:double\(\?startLat\) - 47\.999\) \* \(xsd:double\(\?startLat\) - 47\.999\) \+ \(xsd:double\(\?startLon\) - 7\.8421\) \* \(xsd:double\(\?startLon\) - 7\.8421\) \* 0\.4478, 1e9\)\)\nLIMIT 500$/);
  assert.doesNotMatch(q, /BOUND\(/);
  assert.equal(vm.runInContext("typeof TRAIL_SEARCH_LIMIT === \"undefined\" ? undefined : TRAIL_SEARCH_LIMIT", c), 500);
});

// Kategorie-Filter in SPARQL mit derselben Rangfolge wie classifyTypeGroup (Rad > Wandern > Sonstige).
function typeList(q, negated) {
  const re = negated ? /!EXISTS \{ \?geoent a \?gt \. FILTER\(\?gt IN \(([^)]*)\)\) \}/g : /(?<!!)EXISTS \{ \?geoent a \?gt \. FILTER\(\?gt IN \(([^)]*)\)\) \}/g;
  return [...q.matchAll(re)].map((m) => m[1].split(", ").map((t) => t.replace(/^odta:/, "")).sort());
}
const sorted = (set) => Array.from(set).sort();
test("Kategorie Radweg: nur Wege mit einem Rad-Typ", () => {
  const q = c.buildTrailSearchSparql(48, 9, 25, "rad");
  assert.deepEqual(typeList(q, false), [sorted(vm.runInContext("TRAIL_GROUP_RAD", c))]);
  assert.deepEqual(typeList(q, true), []);
});
test("Kategorie Fußwanderweg: Wander-Typ und kein Rad-Typ", () => {
  const q = c.buildTrailSearchSparql(48, 9, 25, "wandern");
  assert.deepEqual(typeList(q, false), [sorted(vm.runInContext("TRAIL_GROUP_WANDERN", c))]);
  assert.deepEqual(typeList(q, true), [sorted(vm.runInContext("TRAIL_GROUP_RAD", c))]);
});
test("Kategorie Sonstige: weder Rad- noch Wander-Typ", () => {
  const q = c.buildTrailSearchSparql(48, 9, 25, "sonstige");
  assert.deepEqual(typeList(q, false), []);
  assert.deepEqual(typeList(q, true), [sorted(vm.runInContext("TRAIL_GROUP_RAD", c)), sorted(vm.runInContext("TRAIL_GROUP_WANDERN", c))]);
});

test("aggregierte Zeile wird zu einem vollständigen Weg (Sprache, Typen, Startpunkt)", () => {
  const rows = [{
    id: { value: "https://ex.test/t1" },
    names: { value: "en\u241FTrail one\u241Ede\u241FWeg eins" },
    length: { value: "12500" }, diffName: { value: "Mittel" }, duration: { value: "PT3H30M" }, circ: { value: "true" },
    types: { value: "https://odta.io/voc/Trail https://odta.io/voc/HikingTrail" },
    startLat: { value: "48.1" }, startLon: { value: "9.2" },
  }, { id: { value: "https://ex.test/t2" }, names: { value: "\u241FOhne Sprache" }, types: { value: "" }, startLat: { value: "abc" } }];
  const [t1, t2] = c.parseSparqlTrailRows(rows, "de");
  assert.equal(t1.name, "Weg eins");
  assert.equal(c.parseSparqlTrailRows(rows, "en")[0].name, "Trail one");
  assert.equal(t1.lengthKm, 12.5);
  assert.equal(t1.difficulty, "Mittel");
  assert.equal(t1.durationText, "3 Std 30 Min");
  assert.equal(t1.circular, true);
  assert.equal(t1.group, "wandern");
  assert.equal(t1.startLat, 48.1);
  assert.equal(t1.startLon, 9.2);
  assert.equal(t2.name, "Ohne Sprache");
  assert.equal(t2.group, "sonstige");
  assert.equal(t2.startLat, null);
});

test("runSearch fragt die Instanz-Kategorie ab und meldet die Grenze erst bei 500 Wegen", async () => {
  const queries = [];
  const row = (i) => ({ id: { value: "https://ex.test/t" + i }, names: { value: "de\u241FWeg " + i }, types: { value: "https://odta.io/voc/HikingTrail" } });
  let n = 0;
  c.fetchSparql = async (q) => { queries.push(q); return { results: { bindings: Array.from({ length: n }, (_, i) => row(i)) } }; };
  for (const f of ["showStatus", "computeAvailableFacets", "renderFilterOptions", "applyFilters"]) c[f] = () => {};
  const state = { disposed: false, radiusKm: 25, lockedGroup: "rad", lang: "de", config: {} };
  n = 499;
  await c.runSearch(state, [48, 9], "X");
  assert.equal(state.allTrails.length, 499);
  assert.equal(state.hitLimit, false);
  assert.match(queries[0], /FILTER\(EXISTS \{ \?geoent a \?gt \. FILTER\(\?gt IN \(odta:BikeTourTrail/);
  n = 500;
  await c.runSearch(state, [48, 9], "X");
  assert.equal(state.hitLimit, true);
});

test("Hinweis bei erreichtem Limit: nächstgelegene, wechselnde Kandidaten, Umkreis legt die Instanz fest", () => {
  const els = {};
  const el = (id) => (els[id] = els[id] || { innerHTML: "", querySelectorAll: () => [], querySelector: () => null, addEventListener: () => {} });
  const trail = { id: "t1", name: "Weg 1", group: "wandern", lengthKm: 5, difficulty: "Mittel" };
  const state = { uid: "u", root: { querySelector: (sel) => el(sel) }, allTrails: [trail], filteredTrails: [trail],
    page: 0, pageSize: 10, hitLimit: true };
  c.renderList(state);
  const html = els["#ww-list-u"].innerHTML;
  assert.match(html, /die nächstgelegenen unter den Treffern, die die DZT-Umkreissuche liefert/);
  assert.match(html, /können zwischen Abrufen wechseln/);
  assert.doesNotMatch(html, /Kleineren Umkreis wählen/);
  assert.match(html, /Umkreis legt die Instanz fest/);
  assert.match(html, /höchstens 500 Wege/);
});
