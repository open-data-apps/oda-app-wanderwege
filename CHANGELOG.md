# Changelog

## 1.7.8 - 2026-10-14
- FEAT: Die DZT-Abfrage sortiert nach Entfernung des Startpunkts (Wege ohne Startpunkt am Ende); bei erreichter Zeilengrenze (`LIMIT 1000`) werden die nächstgelegenen statt einer zufälligen Auswahl geladen (gemessen: Freiburg 25 km – Startpunkte jetzt innerhalb von 22 km statt bis 121 km, Median 15 statt 21 km). Grenze und Paging unverändert; die Antwortzeit steigt auf etwa das 1,5- bis 4-Fache (gemessen bis 4,4 s bei 50 km und 5,1 s bei 100 km).
- FIX: Hinweis bei erreichter Grenze, Methodik und README benennen, dass die DZT-Umkreissuche zwischen Abrufen wechselnde Treffer liefern kann.
- FIX: Der Grenzhinweis rät nicht mehr zu einem kleineren Umkreis, den Nutzer nicht wählen können; der Umkreis ist Teil der Instanz-Konfiguration.
- TEST: Neuer `tests/sparql-query.test.cjs` (Abfrageaufbau und Grenzhinweis gegen die ausgelieferte `app/app.js`); Testbefehl im README.

## 1.7.7 - 2026-10-13
- FIX: Standard-Fehleranzeige gibt präzisere Tipps: ein „Failed to fetch“ ohne Proxy-Kontext erhält einen Netzwerk-Hinweis statt `proxyAktiv`; der 404-Hinweis gilt nur noch für echte HTTP-404-Antworten und nennt den lokal fehlenden Proxy/Relay statt pauschal „Datensatz auf dem Portal nicht gefunden“.

## 1.7.6 - 2026-10-13
- DOC: Kommentar zur automatischen Erstsuche steht wieder über initSearchFromConfig.

## 1.7.5 - 2026-10-08
- FIX: F-112: Unbekannte Antwortstrukturen als Formatfehler statt als leere Daten anzeigen; bekannte leere Listen bleiben gültig.
- FIX: F-124: Fehlende/leere/ungültige Detailkennzahlen bleiben unbekannt und werden nicht als 0 exportiert. Explizite numerische 0 bleibt erhalten.

## 1.7.4 - 2026-10-08
- FIX: F-125: Fehlende/falsch konfigurierte Quelle bleibt auch nach Kontakt/Startseite als Konfigurationsfehler sichtbar. Eine korrigierte Konfiguration wird erneut geprüft.

## 1.7.3 - 2026-10-02
- ENH: Verwendete ODAS-Dienste in `odas-services` deklariert.

## 1.7.2 - 2026-09-08
- **FIX:** Variante-A-Verdrahtung (F-92): Typprüfung (sparql) der DZT-Quelle vor dem ersten Fetch (Relay-Sonderfall: geprüft wird die konfigurierte URL); fehlende Datenquelle über `renderOdasFehler`, "kein Ort" bleibt Info-Zustand (1.7.1 -> 1.7.2).

## 1.7.2 - 2026-09-08

## 1.7.1 - 2026-09-07
- **FIX:** Frictionless-Härtung: `daten.beispiel` dokumentiert DZT-Relay-Pflicht und 3B-Ausnahme (Basis-Endpunkt ohne Query nicht validierbar — Code-Beleg: `dztApiPath` verwirft Query-Anteile, `fetchSparql` baut die Query zur Laufzeit). Schema vollständig, keine Key-Funde im App-Code.

## 1.7.0 - 2026-08-25
- **FIX:** Tote Anbieter-Shortcodes in Kontakt/Impressum ersetzt (`{{odp.anbieter.url-extern}}` → `{{odp.anbieter.url}}`, `tel:{{odp.anbieter.telcode}}` → `tel:{{odp.anbieter.tel}}`).


## 1.6.0 - 2026-08-22
- **CHG:** `version` in `app-package.json` zu `app-version` umbenannt.
- **ENH:** Top-Level-Feld `app-package-version` ergänzt (Wert `"2"`: mehrere benannte API-URLs über `instanz-config.apiurls`).

## 1.5.0 - 2026-08-21
- **FIX:** `href`-Interpolation der Lizenz-URL im Detail-Panel (`detail.licenseUrl`) explizit an `safeHttpUrl(...)` gebunden, damit die Absicherung am Sink sichtbar ist (der Wert war bereits bei der Erzeugung sanitisiert, der Linter verlangt aber eine Bindung direkt am `href`).
- **FIX:** App im Vendor-Manifest (`tools/odas-vendor-check/manifest.json`) nachgetragen — fehlte komplett, wodurch jeder referenzierte Host als nicht erlaubt galt. `nominatim.openstreetmap.org`/`tile.openstreetmap.org` (echte Browser-Fetches) unter `drittanbieter` ergänzt; `proxy.opendatagermany.io` (serverseitiger DZT-Relay) sowie die RDF/SPARQL-Namespace-Konstanten `schema.org`, `odta.io`, `vocab.sti2.at`, `semantify.it`, `www.ontotext.com` (kein Datenabruf) unter `host-ausnahmen` begründet.

## 1.4.0 - 2026-08-21
- **CHG:** Skalares `apiurl` durch das Array-Feld `apiurls` ersetzt (`typ: "array"`, Eintrag `wanderwege`). Neuer Standard portfolioweit; `apiurl` entfällt. `app.js` liest die Datenquelle jetzt über `getOdasApiUrl(configdata, "wanderwege")`.

## 1.3.0 - 2026-08-20
- Markdown-Metadaten: Paketbeschreibungen auf echtes Markdown umgestellt, exakte Identität Top-Level/Instanz hergestellt, lokale HTML-Fixture semantisch gespiegelt.

## 1.2.0 - 2026-08-20
- BREAKING: `apiKey` entfernt aus `instanz-config` — die App verwaltet keinen eigenen DZT-API-Key
  mehr. Alle Abrufe laufen über den neuen ODAS-DZT-Relay (`<app-url>/dzt?path=…`), der Host,
  `/api/`-Präfix und den plattformseitig hinterlegten API-Key ergänzt. Damit entfällt der bisherige
  Vorbehalt gegen den ODAS-Live-Betrieb (siehe README).
- Voraussetzung: `open-data-app-store` ab Commit `d2a8540` („Implement DNZ Proxy endpoint").
- Außerhalb einer ODAS-Instanz (Live Server, Standalone) liefert die App keine Wegedaten mehr,
  weil der Relay dort nicht existiert.

## 1.1.2 - 2026-08-19
- FIX: `kurzbeschreibung` in `app-package.json` war 210 Zeichen lang und überschritt damit das
  191-Zeichen-Limit der ODAS-Plattform (Spalte `shortDescription`) — jeder Upload eines Builds
  schlug mit HTTP 500 fehl. Text auf 146 Zeichen gekürzt.

## 1.1.1 - 2026-08-19
- FIX: Klick auf einen Kartenmarker öffnete die Detailansicht nur, wenn der Weg zufällig auf
  der aktuell sichtbaren Listenseite lag. `scrollToTrail()` springt jetzt zuerst auf die
  richtige Seite, bevor Detailansicht und Streckenlinie geladen werden.

## 1.1.0 - 2026-08-19
- BREAKING: Ort, Umkreis und Kategorie sind jetzt Instanz-Konfiguration (`ort`, `radiusKm`,
  `kategorie`) statt Nutzer:inneneingabe — kein Suchfeld, kein Radius-Dropdown, kein
  Art-Filter und kein „Standort verwenden“-Button mehr im UI
- ENH: Automatischer Suchlauf beim Erstaufruf einer Instanz aus der konfigurierten Ortsangabe
- ENH: Zustand (Ergebnisse, Filterauswahl, Detail-Cache) überlebt Seitenwechsel — kein
  erneuter API-Abruf beim Zurückkehren zur Startseite
- ENH: Automatisch generierter Erklärtext aus Ort/Umkreis/Kategorie
- ENH: KPI-Kachel „Arten“ entfernt (wäre bei fester Kategorie immer „1“ gewesen)

## 1.0.0 - 2026-08-19
- Erste Version: Umkreissuche nach Wander- und Radwegen (odta:Trail) im DZT Knowledge Graph
- Ortssuche (Nominatim) und Standort-Button mit wählbarem Umkreis
- SPARQL-Geo-Umkreisabfrage liefert Name, Länge, Schwierigkeit, Dauer, Rundweg-Kennzeichen und Art je Treffer in einem Request
- KPI-Kacheln, Filter nach Art/Schwierigkeit/Länge/Rundweg, Kartenmarker, paginierte Liste
- Detailansicht mit Streckenlinie auf der Karte, Höhenprofil (wenn Höhendaten vorliegen) und ODTA-konformem JSON-LD-Export
