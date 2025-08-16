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
  const sourcesAddedRef = useRef(false);
  const handlersAddedRef = useRef(false);
  const [hoveredCountryName, setHoveredCountryName] = useState("");
  const [selectedCountryName, setSelectedCountryName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [visitedNames, setVisitedNames] = useState([]);

  const { session } = UserAuth();
  const { visited, loadVisited } = useVisitedStore();
  const { countries, fetchCountries } = useCountryStore();

  useEffect(() => {
    fetchCountries?.();
    if (session?.user?.id) loadVisited?.(session.user.id);
  }, [session?.user?.id, fetchCountries, loadVisited]);

  useEffect(() => {
    if (!Array.isArray(visited) || !Array.isArray(countries)) return;
    const idToName = new Map(countries.map((c) => [c.id, c.name]));
    const names = visited.map((v) => idToName.get(v.country_id)).filter(Boolean);
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

      // Fetch GeoJSON
      let worldData = null;
      try {
        const res = await fetch(WORLD_GEOJSON_URL);
        worldData = await res.json();
        const featureCount = Array.isArray(worldData?.features) ? worldData.features.length : 0;
        console.log("Loaded world GeoJSON features:", featureCount);
      } catch (e) {
        console.error("Failed to fetch world GeoJSON", e);
        return;
      }

      if (!currentMap.getSource("countries")) {
        currentMap.addSource("countries", { type: "geojson", data: worldData });
      }

      const buildNotVisitedFilter = (names) => {
        if (!names || names.length === 0) return ["all"]; // match all
        return [
          "all",
          ["!in", "name", ...names],
          ["!in", "ADMIN", ...names],
          ["!in", "admin", ...names]
        ];
      };
      const notVisitedFilter = buildNotVisitedFilter(visitedNames);

      // Non-visited grey overlay
      if (!currentMap.getLayer("countries-nonvisited")) {
        currentMap.addLayer({
          id: "countries-nonvisited",
          type: "fill",
          source: "countries",
          paint: { "fill-color": "#9ca3af", "fill-opacity": 0.6 },
          filter: notVisitedFilter
        });
      }

      // Thin outlines for all
      if (!currentMap.getLayer("countries-outline")) {
        currentMap.addLayer({
          id: "countries-outline",
          type: "line",
          source: "countries",
          paint: { "line-color": "#111827", "line-width": 0.6, "line-opacity": 0.6 }
        });
      }

      // Transparent layer for events across all countries
      if (!currentMap.getLayer("countries-events")) {
        currentMap.addLayer({
          id: "countries-events",
          type: "fill",
          source: "countries",
          paint: { "fill-color": "#000000", "fill-opacity": 0 }
        });
      }

      // Highlight layer
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
          const bbox = turf.bbox(feature);
          currentMap.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 50, maxZoom: 5 });
          setSelectedCountryName(name);
          setShowForm(true);
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
  }, [visitedNames]);

  // Update non-visited overlay filter when visited list changes
  useEffect(() => {
    const currentMap = mapRef.current;
    if (!currentMap) return;

    const buildNotVisitedFilter = (names) => {
      if (!names || names.length === 0) return ["all"];
      return [
        "all",
        ["!in", "name", ...names],
        ["!in", "ADMIN", ...names],
        ["!in", "admin", ...names]
      ];
    };
    const notVisitedFilter = buildNotVisitedFilter(visitedNames);

    if (currentMap.getLayer("countries-nonvisited")) {
      try {
        currentMap.setFilter("countries-nonvisited", notVisitedFilter);
      } catch (e) {
        console.error("Failed to update non-visited filter", e);
      }
    }
  }, [visitedNames]);

  const handleSubmitMemory = async ({ country, title, date, notes }) => {
    try {
      if (!session?.user?.id) {
        alert("Please log in to save a memory.");
        return;
      }
      const { error } = await addMemory({ userId: session.user.id, country, title, date, notes });
      if (error) throw error;
      setShowForm(false);
      alert("Memory saved!");
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
        <MemoryForm countryName={selectedCountryName} onClose={() => setShowForm(false)} onSubmit={handleSubmitMemory} />
      )}
    </div>
  );
};

export default MapPage; 