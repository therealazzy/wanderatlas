import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { geoPath, geoGraticule } from 'd3-geo';
import { latLngToVector3, createCountryGeometry } from '../utils/geoUtils';

const CountryBoundaries = () => {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  
 
  useEffect(() => {
    const loadCountries = async () => {
      try {
       
        const sampleCountries = [
          {
            id: 'us',
            name: 'United States',
            coordinates: [
              [-125, 48], [-125, 25], [-66, 25], [-66, 48]
            ]
          },
          {
            id: 'uk',
            name: 'United Kingdom',
            coordinates: [
              [-8, 60], [-8, 50], [2, 50], [2, 60]
            ]
          }
          // Add more countries as needed
        ];
        
        setCountries(sampleCountries);
      } catch (error) {
        console.error('Error loading countries:', error);
      }
    };
    
    loadCountries();
  }, []);

  return (
    <group>
      {countries.map((country) => (
        <CountryPolygon 
          key={country.id} 
          country={country}
          isSelected={selectedCountry?.id === country.id}
          onSelect={() => setSelectedCountry(country)}
        />
      ))}
    </group>
  );
};

const CountryPolygon = ({ country, isSelected, onSelect }) => {
  const meshRef = useRef();
  

  const countryGeometry = useMemo(() => {
    try {
      
      const geometry = new THREE.PlaneGeometry(0.1, 0.1);
      
     
      const centerLat = country.coordinates.reduce((sum, coord) => sum + coord[1], 0) / country.coordinates.length;
      const centerLng = country.coordinates.reduce((sum, coord) => sum + coord[0], 0) / country.coordinates.length;
      const position = latLngToVector3(centerLat, centerLng, 1.01); 
      
      geometry.translate(position.x, position.y, position.z);
      
      return geometry;
    } catch (error) {
      console.error('Error creating country geometry:', error);
      return new THREE.BoxGeometry(0.01, 0.01, 0.01); // Fallback
    }
  }, [country]);

 
  const handleClick = (event) => {
    event.stopPropagation();
    onSelect();
    console.log('Selected country:', country.name);
  };

  return (
    <mesh 
      ref={meshRef}
      geometry={countryGeometry}
      onClick={handleClick}
    >
      <meshBasicMaterial 
        color={isSelected ? "#ff0000" : "#ffffff"}
        transparent 
        opacity={0.8}
        wireframe={false}
      />
    </mesh>
  );
};

export default CountryBoundaries;