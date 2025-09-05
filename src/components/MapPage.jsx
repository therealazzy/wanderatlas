import React, { useEffect, useRef, useState, useMemo } from "react";
import maplibregl from "maplibre-gl";
import * as turf from "@turf/turf";
import "maplibre-gl/dist/maplibre-gl.css";
import MemoryForm from "./MemoryForm";
import MemoryViewModal from "./MemoryViewModal";
import { UserAuth } from "../context/AuthContext";
import { addMemory, getMemoryCountsByCountry, getRecentMemories, addCountry } from "../services/memories";
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
  const [recentMemories, setRecentMemories] = useState([]);
  const [selectedMemory, setSelectedMemory] = useState(null);

  const [markers, setMarkers] = useState([]);

  const { session } = UserAuth();
  const { visited, loadVisited, markVisited } = useVisitedStore();
  const { countries, fetchCountries, testConnection } = useCountryStore();

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
      return fc;
    }
  };

  const resolveCountryRow = (featureName, code3, code2) => {
    console.log(`Resolving country: ${featureName}, code3: ${code3}, code2: ${code2}`);
    if (!Array.isArray(countries)) {
      console.log('No countries array available');
      return null;
    }
    const upper = (s) => (s || "").toUpperCase();
    const norm = normalize;

    // First try by codes
    if (code2) {
      const row2 = countries.find((c) => upper(c.code) === upper(code2));
      if (row2) {
        console.log(`Found by code2: ${row2.name}`);
        return row2;
      }
    }
    if (code3) {
      const row3 = countries.find((c) => upper(c.code) === upper(code3));
      if (row3) {
        console.log(`Found by code3: ${row3.name}`);
        return row3;
      }
    }

    // Then try by exact name match
    const nFeature = norm(featureName);
    let best = countries.find((c) => {
      const nDb = norm(c.name);
      return nDb === nFeature;
    });
    if (best) {
      console.log(`Found by exact name match: ${best.name}`);
      return best;
    }

    // Then try by partial name match
    best = countries.find((c) => {
      const nDb = norm(c.name);
      return nDb.includes(nFeature) || nFeature.includes(nDb);
    });
    if (best) {
      console.log(`Found by partial name match: ${best.name}`);
      return best;
    }

    // Try with synonyms
    const synonyms = new Map([
      // United States variations
      ["unitedstatesofamerica", "unitedstates"],
      ["unitedstates", "unitedstatesofamerica"],
      ["usa", "unitedstates"],
      
      // United Kingdom variations
      ["unitedkingdom", "greatbritain"],
      ["greatbritain", "unitedkingdom"],
      ["uk", "unitedkingdom"],
      ["britain", "unitedkingdom"],
      
      // Russia variations
      ["russianfederation", "russia"],
      ["russia", "russianfederation"],
      
      // Korea variations
      ["korearepublicof", "southkorea"],
      ["koreademocraticpeoplesrepublicof", "northkorea"],
      ["southkorea", "korearepublicof"],
      ["northkorea", "koreademocraticpeoplesrepublicof"],
      
      // Ireland variations
      ["irishrepublic", "ireland"],
      ["ireland", "irishrepublic"],
      
      // Syria variations
      ["syrianarabrepublic", "syria"],
      ["syria", "syrianarabrepublic"],
      
      // Moldova variations
      ["moldovarepublicof", "moldova"],
      ["moldova", "moldovarepublicof"],
      
      // Tanzania variations
      ["tanzaniatheunitedrepublicof", "tanzania"],
      ["tanzania", "tanzaniatheunitedrepublicof"],
      
      // Bolivia variations
      ["boliviaplurinationalstateof", "bolivia"],
      ["bolivia", "boliviaplurinationalstateof"],
      
      // Iran variations
      ["iranislamicrepublicof", "iran"],
      ["iran", "iranislamicrepublicof"],
      
      // Laos variations
      ["laopeoplesdemocraticrepublic", "laos"],
      ["laos", "laopeoplesdemocraticrepublic"],
      
      // Myanmar variations
      ["myanmarburma", "myanmar"],
      ["myanmar", "myanmarburma"],
      ["burma", "myanmar"],
      
      // Czech Republic variations
      ["czechrepublic", "czechia"],
      ["czechia", "czechrepublic"],
      
      // Slovakia variations
      ["slovakrepublic", "slovakia"],
      ["slovakia", "slovakrepublic"],
      
      // Additional common variations
      ["france", "frenchrepublic"],
      ["frenchrepublic", "france"],
      ["germany", "federalrepublicofgermany"],
      ["federalrepublicofgermany", "germany"],
      ["italy", "italianrepublic"],
      ["italianrepublic", "italy"],
      ["spain", "kingdomofspain"],
      ["kingdomofspain", "spain"],
      ["poland", "republicofpoland"],
      ["republicofpoland", "poland"],
      ["lithuania", "republicoflithuania"],
      ["republicoflithuania", "lithuania"],
      ["latvia", "republicoflatvia"],
      ["republicoflatvia", "latvia"],
      ["estonia", "republicofestonia"],
      ["republicofestonia", "estonia"],
      ["finland", "republicoffinland"],
      ["republicoffinland", "finland"],
      ["sweden", "kingdomofsweden"],
      ["kingdomofsweden", "sweden"],
      ["norway", "kingdomofnorway"],
      ["kingdomofnorway", "norway"],
      ["denmark", "kingdomofdenmark"],
      ["kingdomofdenmark", "denmark"],
      ["netherlands", "kingdomofthenetherlands"],
      ["kingdomofthenetherlands", "netherlands"],
      ["portugal", "portugueserepublic"],
      ["portugueserepublic", "portugal"],
      ["greece", "hellenicrepublic"],
      ["hellenicrepublic", "greece"],
      ["austria", "republicofaustria"],
      ["republicofaustria", "austria"],
      ["switzerland", "swissconfederation"],
      ["swissconfederation", "switzerland"],
      ["belgium", "kingdomofbelgium"],
      ["kingdomofbelgium", "belgium"],
      ["luxembourg", "grandduchyofluxembourg"],
      ["grandduchyofluxembourg", "luxembourg"],
    ]);
    
    const mapped = synonyms.get(nFeature) || nFeature;
    best = countries.find((c) => norm(c.name) === mapped);
    if (best) {
      console.log(`Found by synonym: ${best.name}`);
      return best;
    }

    // Try fuzzy matching - look for countries that contain any part of the feature name
    best = countries.find((c) => {
      const nDb = norm(c.name);
      const words = nFeature.split(/(?=[A-Z])|[\s-]+/).filter(w => w.length > 2);
      return words.some(word => nDb.includes(word)) || nFeature.split(' ').some(word => nDb.includes(norm(word)));
    });
    if (best) {
      console.log(`Found by fuzzy match: ${best.name}`);
      return best;
    }

    // Try reverse fuzzy matching - look for feature names that contain parts of country names
    best = countries.find((c) => {
      const nDb = norm(c.name);
      const dbWords = nDb.split(/[\s-]+/).filter(w => w.length > 2);
      return dbWords.some(word => nFeature.includes(word));
    });
    if (best) {
      console.log(`Found by reverse fuzzy match: ${best.name}`);
      return best;
    }

    // Try partial word matching
    best = countries.find((c) => {
      const nDb = norm(c.name);
      const featureWords = nFeature.split(/[\s-]+/).filter(w => w.length > 2);
      const dbWords = nDb.split(/[\s-]+/).filter(w => w.length > 2);
      
      // Check if any word from feature matches any word from country
      return featureWords.some(fWord => 
        dbWords.some(dWord => 
          fWord.includes(dWord) || dWord.includes(fWord) || 
          fWord.substring(0, 3) === dWord.substring(0, 3) // First 3 chars match
        )
      );
    });
    if (best) {
      console.log(`Found by partial word match: ${best.name}`);
      return best;
    }

    // If not found in database, return null
    console.log(`Country not in database: ${featureName}`);
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

  const loadRecentMemories = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { data, error } = await getRecentMemories(session.user.id, 5);
      if (error) {
        console.error('Error fetching recent memories:', error);
        return;
      }
      setRecentMemories(data || []);
    } catch (err) {
      console.error('Error loading recent memories:', err);
    }
  };

  const renderMemoryMarkers = async () => {
    const map = mapRef.current;
    if (!map || !worldDataRef.current || !session?.user?.id) return;

    console.log('Rendering memory markers...');
    const { data, error } = await getMemoryCountsByCountry(session.user.id);
    if (error) {
      console.error('Error fetching memory counts:', error);
      return;
    }
    
    console.log('Memory counts data:', data);
    if (!countries || countries.length === 0) {
      console.log('No countries loaded yet');
      return;
    }

    console.log('Available countries for mapping:', countries.map(c => ({ id: c.id, name: c.name, code: c.code })));
    
    const idToCode = new Map(countries.map((c) => [c.id, (c.code || '').toUpperCase()]));
    const idToName = new Map(countries.map((c) => [c.id, c.name]));
    
    console.log('ID to Code mapping:', Array.from(idToCode.entries()));
    console.log('ID to Name mapping:', Array.from(idToName.entries()));

    clearMarkers();
    const newMarkers = [];

    for (const row of (data || [])) {
      const countryId = row.country_id;
      const count = Number(row.count) || 0;
      console.log(`Processing memory row: country_id=${countryId}, count=${count}`);
      
      if (!countryId || count <= 0) {
        console.log(`Skipping row: invalid countryId or count`);
        continue;
      }

      const code = (idToCode.get(countryId) || '').toUpperCase();
      const dbName = idToName.get(countryId) || '';
      const normDbName = normalize(dbName);

      console.log(`Looking for country: ${dbName} (${code}) for country_id: ${countryId}`);

      const feature = (worldDataRef.current.features || []).find((f) => {
        const iso3 = (f.id || f.properties?.iso_a3 || '').toString().toUpperCase();
        const name = f.properties?.name || f.properties?.ADMIN || f.properties?.admin || '';
        const normName = normalize(name);
        
        // Debug logging for Russia specifically
        if (dbName.toLowerCase().includes('russia') || name.toLowerCase().includes('russia')) {
          console.log(`Russia debug - DB: ${dbName} (${code}), GeoJSON: ${name} (${iso3})`);
          console.log(`Russia debug - Normalized DB: ${normDbName}, Normalized GeoJSON: ${normName}`);
        }
        
        // Try by code first
        if (code && iso3 === code) {
          if (dbName.toLowerCase().includes('russia') || name.toLowerCase().includes('russia')) {
            console.log(`Russia found by code match: ${code} === ${iso3}`);
          }
          return true;
        }
        
        // Try by name matching
        if (normDbName && normName) {
          // Exact match
          if (normName === normDbName) {
            if (dbName.toLowerCase().includes('russia') || name.toLowerCase().includes('russia')) {
              console.log(`Russia found by exact name match: ${normName} === ${normDbName}`);
            }
            return true;
          }
          // Partial match
          if (normName.includes(normDbName) || normDbName.includes(normName)) {
            if (dbName.toLowerCase().includes('russia') || name.toLowerCase().includes('russia')) {
              console.log(`Russia found by partial match: ${normName} includes ${normDbName} or vice versa`);
            }
            return true;
          }
          // Word-based matching
          const dbWords = normDbName.split(/[\s-]+/).filter(w => w.length > 2);
          const nameWords = normName.split(/[\s-]+/).filter(w => w.length > 2);
          if (dbWords.some(word => nameWords.includes(word)) || nameWords.some(word => dbWords.includes(word))) {
            if (dbName.toLowerCase().includes('russia') || name.toLowerCase().includes('russia')) {
              console.log(`Russia found by word match: ${dbWords} vs ${nameWords}`);
            }
            return true;
          }
        }
        
        return false;
      });
      
      if (!feature) {
        console.log(`Feature not found for ${dbName} (${code})`);
        continue;
      }

      console.log(`Found feature for ${dbName}, creating marker`);

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

    console.log(`Created ${newMarkers.length} memory markers`);
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
    console.log('MapPage: Initializing...');
    
    // Test connection first
    testConnection?.().then(result => {
      console.log('Connection test result:', result);
    });
    
    fetchCountries?.();
    if (session?.user?.id) loadVisited?.(session.user.id);
  }, [session?.user?.id, fetchCountries, loadVisited, testConnection]);

  // Debug countries loading
  useEffect(() => {
    console.log('MapPage: Countries updated:', countries?.length || 0);
    if (countries && countries.length > 0) {
      console.log('Sample countries:', countries.slice(0, 3));
      console.log('All country names:', countries.map(c => c.name).sort());
    }
  }, [countries]);

  useEffect(() => {
    if (!Array.isArray(visited) || !Array.isArray(countries)) return;
    console.log('Processing visited countries:', visited);
    console.log('Available countries:', countries.length);
    
    const idToCode = new Map(countries.map((c) => [c.id, c.code]));
    const idToName = new Map(countries.map((c) => [c.id, c.name]));
    const codes = visited.map((v) => idToCode.get(v.country_id)).filter(Boolean);
    const names = visited.map((v) => idToName.get(v.country_id)).filter(Boolean);
    
    console.log('Visited codes:', codes);
    console.log('Visited names:', names);
    
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
        
        // Debug: Log some sample countries from GeoJSON
        console.log('GeoJSON countries sample:', baseData.features?.slice(0, 5).map(f => ({
          name: f.properties?.name || f.properties?.ADMIN,
          iso3: f.id || f.properties?.iso_a3,
          iso2: f.properties?.iso_a2
        })));
        
        // Debug: Log all GeoJSON country names
        const geoJsonNames = baseData.features?.map(f => f.properties?.name || f.properties?.ADMIN).filter(Boolean).sort();
        console.log('All GeoJSON country names:', geoJsonNames);
      } catch (e) {
        console.error('Failed to load GeoJSON:', e);
        return;
      }

      const tagged = tagVisited(worldDataRef.current, visitedCodes, visitedNames);

      // Re-read current map after await to ensure it's still mounted
      const currentMap = mapRef.current;
      if (!currentMap) return;

      if (!currentMap.getSource || !currentMap.getSource("countries")) {
        try {
          currentMap.addSource("countries", { type: "geojson", data: tagged });
        } catch (e) {}
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
    } catch (e) {}
  }, [visitedCodes, visitedNames]);

  useEffect(() => {
    renderMemoryMarkers();
    loadRecentMemories();
    return () => clearMarkers();
  }, [session?.user?.id, countries]);

  const handleSubmitMemory = async ({ country, title, date, notes }) => {
    try {
      if (!session?.user?.id) {
        showNotice("Please log in to save a memory.");
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
        showNotice(`Country "${selectedCountryName}" is not available in your countries list. Please add it to the database first.`);
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
      } catch (e) {}
      setVisitedCodes((prev) => (prev?.includes(countryRow.code) ? prev : [...prev, countryRow.code]));
      setVisitedNames((prev) => (prev?.includes(countryRow.name) ? prev : [...prev, countryRow.name]));

      await renderMemoryMarkers();
      await loadRecentMemories();

      setFormSuccess(true);
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess(false);
      }, 1200);
    } catch (err) {
      showNotice("Failed to save memory. Please try again.");
    }
  };

  return (
    <div className="relative w-screen h-screen flex flex-col">
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

      <div ref={mapContainerRef} className="flex-1" />
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
      
      {selectedMemory && (
        <MemoryViewModal memory={selectedMemory} onClose={() => setSelectedMemory(null)} />
      )}
      
      {/* Recent Memories Carousel */}
      {recentMemories.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-4xl px-4">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <h3 className="text-white text-sm font-semibold mb-3 flex items-center justify-center">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
              Recent Memories
            </h3>
            <div className="flex gap-3 justify-center flex-wrap">
              {recentMemories.slice(0, 5).map((memory, index) => (
                <div
                  key={memory.id || index}
                  className="bg-white/10 rounded-lg p-3 w-[200px] border border-white/20 hover:bg-white/20 transition-colors cursor-pointer"
                  onClick={() => setSelectedMemory(memory)}
                >
                  <div className="text-white text-sm font-medium truncate">
                    {memory.title}
                  </div>
                  <div className="text-white/70 text-xs mt-1 truncate">
                    {memory.country_name || 'Unknown Country'}
                  </div>
                  <div className="text-white/50 text-xs mt-1">
                    {memory.memory_date ? new Date(memory.memory_date).toLocaleDateString() : 'No date'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage; 