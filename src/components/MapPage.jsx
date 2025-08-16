import React, { useEffect, useRef, useState, useMemo } from "react";
import maplibregl from "maplibre-gl";
import * as turf from "@turf/turf";
import "maplibre-gl/dist/maplibre-gl.css";
import MemoryForm from "./MemoryForm";
import { UserAuth } from "../context/AuthContext";
import { addMemory, getMemoryCountsByCountry } from "../services/memories";
import { useVisitedStore } from "../stores/useVisitedStore";
import { useCountryStore } from "../stores/useCountryStore";
import Header from './ui/header'

const WORLD_GEOJSON_URL = "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json";
const BASE_STYLE_URL = "https://demotiles.maplibre.org/style.json";

const MapPage = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const worldDataRef = useRef(null);
  const sourcesAddedRef = useRef(false);
  const handlersAddedRef = useRef(false);
  const [hoveredCountryName, setHoveredCountryName] = useState("");
  const [selectedCountryName, setSelectedCountryName] = useState("");
  const [selectedCountryCode3, setSelectedCountryCode3] = useState("");
  const [selectedCountryCode2, setSelectedCountryCode2] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [visitedCodes, setVisitedCodes] = useState([]);
  const [visitedNames, setVisitedNames] = useState([]);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");

  const [markers, setMarkers] = useState([]);

  const { session } = UserAuth();
  const { visited, loadVisited, markVisited } = useVisitedStore();
  const { countries, fetchCountries } = useCountryStore();

  const normalize = (s) => (s || "").toLowerCase().replace(/[^a-z]/g, "");
  const tagVisited = (fc, codes, names) => {
    try {
      const codeSet = new Set((codes || []).map((c) => (c || "").toUpperCase()));
      const normNameSet = new Set((names || []).map((n) => normalize(n)));
      return {
        type: "FeatureCollection",
        features: (fc.features || []).map((f) => {
          const idCode = (f.id || f.properties?.iso_a3 || "").toString().toUpperCase();
          const propName = f.properties?.name || f.properties?.ADMIN || f.properties?.admin || "";
          const normPropName = normalize(propName);
          const isVisited = codeSet.has(idCode) || normNameSet.has(normPropName) || Array.from(normNameSet).some((n) => normPropName.includes(n) || n.includes(normPropName));
          return { ...f, properties: { ...f.properties, _visited: !!isVisited } };
        })
      };
    } catch (e) {
      console.warn("Failed to tag visited flags:", e);
      return fc;
    }
  };

  const resolveCountryRow = (featureName, code3, code2) => {
    if (!Array.isArray(countries)) return null;
    const upper = (s) => (s || "").toUpperCase();
    const norm = normalize;

    if (code2) {
      const row2 = countries.find((c) => upper(c.code) === upper(code2));
      if (row2) return row2;
    }
    if (code3) {
      const row3 = countries.find((c) => upper(c.code) === upper(code3));
      if (row3) return row3;
    }
    const nFeature = norm(featureName);
    let best = countries.find((c) => {
      const nDb = norm(c.name);
      return nDb === nFeature || nDb.includes(nFeature) || nFeature.includes(nDb);
    });
    if (best) return best;

    const synonyms = new Map([
      ["unitedstatesofamerica", "unitedstates"],
      ["russianfederation", "russia"],
      ["korearepublicof", "southkorea"],
      ["koreademocraticpeoplesrepublicof", "northkorea"],
      ["irishrepublic", "ireland"],
      ["syrianarabrepublic", "syria"],
      ["moldovarepublicof", "moldova"],
      ["tanzaniatheunitedrepublicof", "tanzania"],
      ["boliviaplurinationalstateof", "bolivia"],
      ["iranislamicrepublicof", "iran"],
      ["laopeoplesdemocraticrepublic", "laos"],
      ["myanmarburma", "myanmar"],
    ]);
    const mapped = synonyms.get(nFeature) || nFeature;
    best = countries.find((c) => norm(c.name) === mapped);
    if (best) return best;

    return null;
  };

  const clearMarkers = () => {
    try { markers.forEach((m) => m.remove()); } catch {}
    setMarkers([]);
  };

  const showNotice = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 1800);
  };

  const renderMemoryMarkers = async () => {
    const map = mapRef.current;
    if (!map || !worldDataRef.current || !session?.user?.id) return;

    const { data, error } = await getMemoryCountsByCountry(session.user.id);
    if (error) {
      console.warn('Failed to fetch memory counts:', error);
      return;
    }

    if (!countries || countries.length === 0) return;

    const idToCode = new Map(countries.map((c) => [c.id, (c.code || '').toUpperCase()]));
    const idToName = new Map(countries.map((c) => [c.id, c.name]));

    clearMarkers();
    const newMarkers = [];

    for (const row of (data || [])) {
      const countryId = row.country_id;
      const count = Number(row.count) || 0;
      if (!countryId || count <= 0) continue;

      const code = (idToCode.get(countryId) || '').toUpperCase();
      const dbName = idToName.get(countryId) || '';
      const normDbName = normalize(dbName);

      const feature = (worldDataRef.current.features || []).find((f) => {
        const iso3 = (f.id || f.properties?.iso_a3 || '').toString().toUpperCase();
        const name = f.properties?.name || f.properties?.ADMIN || f.properties?.admin || '';
        const normName = normalize(name);
        return (code && iso3 === code) || (normDbName && (normName === normDbName || normName.includes(normDbName) || normDbName.includes(normName)));
      });
      if (!feature) continue;

      const point = turf.pointOnFeature(feature).geometry.coordinates;
      const el = document.createElement('div');
      el.className = 'memory-marker';
      el.style.cssText = 'background:#10b981;color:#fff;border-radius:9999px;padding:4px 8px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.3);transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer;';
      el.textContent = String(count);

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(point)
        .addTo(map);
      newMarkers.push(marker);
    }

    setMarkers(newMarkers);
  };

  const countryOptions = useMemo(() => {
    if (!query) return [];
    const q = query.trim().toLowerCase();
    if (!Array.isArray(countries)) return [];
    return countries
      .filter(c => (c.name || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, countries]);

  const flyToCountryAndOpen = (countryRow) => {
    const map = mapRef.current;
    if (!map || !worldDataRef.current || !countryRow) return;
    // Find feature by ISO3 or name
    const iso3 = (countryRow.code || '').toUpperCase();
    const feature = (worldDataRef.current.features || []).find((f) => {
      const fcode = (f.id || f.properties?.iso_a3 || '').toString().toUpperCase();
      const fname = (f.properties?.name || f.properties?.ADMIN || '').toString();
      return (iso3 && fcode === iso3) || fname === countryRow.name;
    });
    if (!feature) return;
    const bbox = turf.bbox(feature);
    map.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 50, maxZoom: 5 });
    setSelectedCountryName(countryRow.name);
    setSelectedCountryCode3(iso3);
    setSelectedCountryCode2("");
    setSelectedCountry(countryRow);
    setShowForm(true);
    setFormSuccess(false);
    setQuery("");
  };

  useEffect(() => {
    fetchCountries?.();
    if (session?.user?.id) loadVisited?.(session.user.id);
  }, [session?.user?.id, fetchCountries, loadVisited]);

  useEffect(() => {
    if (!Array.isArray(visited) || !Array.isArray(countries)) return;
    const idToCode = new Map(countries.map((c) => [c.id, c.code]));
    const idToName = new Map(countries.map((c) => [c.id, c.name]));
    const codes = visited.map((v) => idToCode.get(v.country_id)).filter(Boolean);
    const names = visited.map((v) => idToName.get(v.country_id)).filter(Boolean);
    setVisitedCodes(codes);
    setVisitedNames(names);
  }, [visited, countries]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const containerEl = mapContainerRef.current;
    containerEl.style.width = "100%";
    containerEl.style.height = `${window.innerHeight}px`;

    const resize = () => {
      if (!mapRef.current) return;
      containerEl.style.height = `${window.innerHeight}px`;
      mapRef.current.resize();
    };
    window.addEventListener("resize", resize);

    const map = new maplibregl.Map({
      container: containerEl,
      style: BASE_STYLE_URL,
      center: [0, 20],
      zoom: 1.5,
      doubleClickZoom: false,
      dragRotate: false,
      pitchWithRotate: false
    });

    mapRef.current = map;

    // Disable touch rotation gestures
    if (map.touchZoomRotate && map.touchZoomRotate.disableRotation) {
      map.touchZoomRotate.disableRotation();
    }

    // Only show zoom controls; hide compass (bearing control)
    map.addControl(new maplibregl.NavigationControl({ showZoom: true, showCompass: false }), "top-right");

    const setupMap = async () => {
      const initialMap = mapRef.current;
      if (!initialMap || sourcesAddedRef.current) return;

      try {
        const res = await fetch(WORLD_GEOJSON_URL);
        const baseData = await res.json();
        worldDataRef.current = baseData;
      } catch (e) {
        console.error("Failed to fetch world GeoJSON", e);
        return;
      }

      const tagged = tagVisited(worldDataRef.current, visitedCodes, visitedNames);

      // Re-read current map after await to ensure it's still mounted
      const currentMap = mapRef.current;
      if (!currentMap) return;

      if (!currentMap.getSource || !currentMap.getSource("countries")) {
        try {
          currentMap.addSource("countries", { type: "geojson", data: tagged });
        } catch (e) {
          // Source might already exist in a parallel init; continue
        }
      } else {
        try {
          currentMap.getSource("countries")?.setData(tagged);
        } catch {}
      }

      if (!currentMap.getLayer || !currentMap.getLayer("countries-nonvisited")) {
        try {
          currentMap.addLayer({
            id: "countries-nonvisited",
            type: "fill",
            source: "countries",
            paint: { "fill-color": "#9ca3af", "fill-opacity": 0.6 },
            filter: ["!=", ["get", "_visited"], true]
          });
        } catch {}
      }

      if (!currentMap.getLayer || !currentMap.getLayer("countries-outline")) {
        try {
          currentMap.addLayer({
            id: "countries-outline",
            type: "line",
            source: "countries",
            paint: { "line-color": "#111827", "line-width": 0.6, "line-opacity": 0.6 }
          });
        } catch {}
      }

      if (!currentMap.getLayer || !currentMap.getLayer("countries-events")) {
        try {
          currentMap.addLayer({
            id: "countries-events",
            type: "fill",
            source: "countries",
            paint: { "fill-color": "#000000", "fill-opacity": 0 }
          });
        } catch {}
      }

      if (!currentMap.getLayer || !currentMap.getLayer("countries-highlight")) {
        try {
          currentMap.addLayer({
            id: "countries-highlight",
            type: "fill",
            source: "countries",
            paint: { "fill-color": "#ef4444", "fill-opacity": 0.35 },
            filter: ["==", "name", ""]
          });
        } catch {}
      }

      sourcesAddedRef.current = true;

      if (!handlersAddedRef.current) {
        currentMap.on("mousemove", "countries-events", (e) => {
          const feature = e.features && e.features[0];
          if (!feature) return;
          const name = feature.properties?.name || feature.properties?.ADMIN || feature.properties?.admin || "";
          setHoveredCountryName(name);
          if (currentMap.getLayer && currentMap.getLayer("countries-highlight")) currentMap.setFilter("countries-highlight", ["==", "name", name]);
          currentMap.getCanvas().style.cursor = "pointer";
        });

        currentMap.on("mouseleave", "countries-events", () => {
          setHoveredCountryName("");
          if (currentMap.getLayer && currentMap.getLayer("countries-highlight")) currentMap.setFilter("countries-highlight", ["==", "name", ""]);
          currentMap.getCanvas().style.cursor = "";
        });

        currentMap.on("click", "countries-events", (e) => {
          const feature = e.features && e.features[0];
          if (!feature) return;
          const name = feature.properties?.name || feature.properties?.ADMIN || feature.properties?.admin || "";
          const code3 = (feature.id || feature.properties?.iso_a3 || "").toString().toUpperCase();
          const code2 = (feature.properties?.iso_a2 || feature.properties?.ISO_A2 || "").toString().toUpperCase();
          const bbox = turf.bbox(feature);
          currentMap.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 50, maxZoom: 5 });

          const resolved = resolveCountryRow(name, code3, code2);
          if (!resolved) {
            showNotice(`${name} isn’t available in your countries list`);
            return;
          }

          setSelectedCountryName(name);
          setSelectedCountryCode3(code3);
          setSelectedCountryCode2(code2);
          setSelectedCountry(resolved);
          setShowForm(true);
          setFormSuccess(false);
        });

        handlersAddedRef.current = true;
      }

      try { currentMap.resize(); } catch {}

      renderMemoryMarkers();
    };

    map.on("load", setupMap);

    return () => {
      window.removeEventListener("resize", resize);
      handlersAddedRef.current = false;
      sourcesAddedRef.current = false;
      clearMarkers();
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  }, [visitedCodes, visitedNames, session?.user?.id, countries]);

  useEffect(() => {
    const currentMap = mapRef.current;
    if (!currentMap) return;
    if (!worldDataRef.current) return;
    try {
      const tagged = tagVisited(worldDataRef.current, visitedCodes, visitedNames);
      const src = currentMap.getSource("countries");
      if (src) {
        src.setData(tagged);
      }
    } catch (e) {
      console.error("Failed to retag source on visited change", e);
    }
  }, [visitedCodes, visitedNames]);

  useEffect(() => {
    renderMemoryMarkers();
    return () => clearMarkers();
  }, [session?.user?.id, countries]);

  const handleSubmitMemory = async ({ country, title, date, notes }) => {
    try {
      if (!session?.user?.id) {
        alert("Please log in to save a memory.");
        return;
      }

      let countryRow = selectedCountry;
      if (!countryRow) {
        if (!countries || countries.length === 0) {
          await fetchCountries?.();
        }
        countryRow = resolveCountryRow(selectedCountryName, selectedCountryCode3, selectedCountryCode2);
      }

      if (!countryRow) {
        showNotice("Could not resolve selected country. Please try again.");
        return;
      }

      const { error } = await addMemory({
        userId: session.user.id,
        countryId: countryRow.id,
        title,
        date,
        notes
      });
      if (error) throw error;

      try {
        await markVisited(session.user.id, countryRow.id, date || null);
      } catch (e) {
        console.warn('Failed to mark visited in DB:', e);
      }
      setVisitedCodes((prev) => (prev?.includes(countryRow.code) ? prev : [...prev, countryRow.code]));
      setVisitedNames((prev) => (prev?.includes(countryRow.name) ? prev : [...prev, countryRow.name]));

      await renderMemoryMarkers();

      setFormSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess(false);
      }, 1200);
    } catch (err) {
      console.error("Failed to save memory:", err);
      showNotice("Failed to save memory. Please try again.");
    }
  };

  return (
    <div className="relative w-screen h-screen">
      <Header>
        <div className="relative w-full max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries..."
            className="w-full px-4 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
          />
          {query && countryOptions.length > 0 && (
            <div className="absolute mt-2 w-full rounded-md bg-black/80 text-white border border-white/10 max-h-64 overflow-auto z-50">
              {countryOptions.map((c) => (
                <button
                  key={c.id}
                  onClick={() => flyToCountryAndOpen(c)}
                  className="block w-full text-left px-4 py-2 hover:bg-white/10"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="opacity-60 ml-2 text-xs">{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Header>

      <div ref={mapContainerRef} className="absolute inset-0" />
      {hoveredCountryName && !showForm && (
        <div className="absolute left-3 top-20 z-40 rounded bg-black/70 text-white px-3 py-1 text-sm">{hoveredCountryName}</div>
      )}
      {notice && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md bg-black/70 text-white text-sm shadow">
          {notice}
        </div>
      )}
      {showForm && (
        <MemoryForm countryName={selectedCountryName} onClose={() => setShowForm(false)} onSubmit={handleSubmitMemory} success={formSuccess} />
      )}
    </div>
  );
};

export default MapPage; 