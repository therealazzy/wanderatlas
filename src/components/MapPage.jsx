import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import * as turf from "@turf/turf";
import "maplibre-gl/dist/maplibre-gl.css";
import MemoryForm from "./MemoryForm";
import { UserAuth } from "../context/AuthContext";
import { addMemory } from "../services/memories";
import { useVisitedStore } from "../stores/useVisitedStore";
import { useCountryStore } from "../stores/useCountryStore";

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

    console.warn("Failed to resolve country", { featureName, code3, code2, sample: countries.slice(0,3) });
    return null;
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
      dragRotate: false
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const setupMap = async () => {
      const currentMap = mapRef.current;
      if (!currentMap || sourcesAddedRef.current) return;

      try {
        const res = await fetch(WORLD_GEOJSON_URL);
        const baseData = await res.json();
        worldDataRef.current = baseData;
      } catch (e) {
        console.error("Failed to fetch world GeoJSON", e);
        return;
      }

      const tagged = tagVisited(worldDataRef.current, visitedCodes, visitedNames);

      if (!currentMap.getSource("countries")) {
        currentMap.addSource("countries", { type: "geojson", data: tagged });
      }

      if (!currentMap.getLayer("countries-nonvisited")) {
        currentMap.addLayer({
          id: "countries-nonvisited",
          type: "fill",
          source: "countries",
          paint: { "fill-color": "#9ca3af", "fill-opacity": 0.6 },
          filter: ["!=", ["get", "_visited"], true]
        });
      }

      if (!currentMap.getLayer("countries-outline")) {
        currentMap.addLayer({
          id: "countries-outline",
          type: "line",
          source: "countries",
          paint: { "line-color": "#111827", "line-width": 0.6, "line-opacity": 0.6 }
        });
      }

      if (!currentMap.getLayer("countries-events")) {
        currentMap.addLayer({
          id: "countries-events",
          type: "fill",
          source: "countries",
          paint: { "fill-color": "#000000", "fill-opacity": 0 }
        });
      }

      if (!currentMap.getLayer("countries-highlight")) {
        currentMap.addLayer({
          id: "countries-highlight",
          type: "fill",
          source: "countries",
          paint: { "fill-color": "#ef4444", "fill-opacity": 0.35 },
          filter: ["==", "name", ""]
        });
      }

      sourcesAddedRef.current = true;

      if (!handlersAddedRef.current) {
        currentMap.on("mousemove", "countries-events", (e) => {
          const feature = e.features && e.features[0];
          if (!feature) return;
          const name = feature.properties?.name || feature.properties?.ADMIN || feature.properties?.admin || "";
          setHoveredCountryName(name);
          if (currentMap.getLayer("countries-highlight")) currentMap.setFilter("countries-highlight", ["==", "name", name]);
          currentMap.getCanvas().style.cursor = "pointer";
        });

        currentMap.on("mouseleave", "countries-events", () => {
          setHoveredCountryName("");
          if (currentMap.getLayer("countries-highlight")) currentMap.setFilter("countries-highlight", ["==", "name", ""]);
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
          setSelectedCountryName(name);
          setSelectedCountryCode3(code3);
          setSelectedCountryCode2(code2);

          // Resolve immediately and cache
          const resolved = resolveCountryRow(name, code3, code2);
          setSelectedCountry(resolved || null);

          setShowForm(true);
          setFormSuccess(false);
        });

        handlersAddedRef.current = true;
      }

      currentMap.resize();
    };

    map.on("load", setupMap);

    return () => {
      window.removeEventListener("resize", resize);
      handlersAddedRef.current = false;
      sourcesAddedRef.current = false;
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  }, [visitedCodes, visitedNames]);

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

  const handleSubmitMemory = async ({ country, title, date, notes }) => {
    try {
      if (!session?.user?.id) {
        alert("Please log in to save a memory.");
        return;
      }

      let countryRow = selectedCountry;
      if (!countryRow) {
        // Countries might not have loaded yet; try resolving now
        if (!countries || countries.length === 0) {
          await fetchCountries?.();
        }
        countryRow = resolveCountryRow(selectedCountryName, selectedCountryCode3, selectedCountryCode2);
      }

      if (!countryRow) {
        alert("Could not resolve selected country. Please try again.");
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

      setFormSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess(false);
      }, 1200);
    } catch (err) {
      console.error("Failed to save memory:", err);
      alert("Failed to save memory. Please try again.");
    }
  };

  return (
    <div className="relative w-screen h-screen">
      <div ref={mapContainerRef} className="absolute inset-0" />
      {hoveredCountryName && !showForm && (
        <div className="absolute left-3 top-3 z-40 rounded bg-black/70 text-white px-3 py-1 text-sm">{hoveredCountryName}</div>
      )}
      {showForm && (
        <MemoryForm countryName={selectedCountryName} onClose={() => setShowForm(false)} onSubmit={handleSubmitMemory} success={formSuccess} />
      )}
    </div>
  );
};

export default MapPage; 