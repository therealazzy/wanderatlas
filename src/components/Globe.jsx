import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const Globe = () => {
  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={1.5}
          maxDistance={5}
        />
        
        {/* Country Boundaries */}
        <CountryBoundaries />
        
        {/* Globe Mesh */}
        <GlobeMesh />
        
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 3, 5]} 
          intensity={1} 
          castShadow 
        />
      </Canvas>
    </div>
  );
};

// Globe Mesh Component
const GlobeMesh = () => {
  const meshRef = useRef();
  const [isRotating, setIsRotating] = useState(true);
  
  useFrame((state, delta) => {
    if (isRotating && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial 
        color="#4a90e2"
        transparent={true}
        opacity={0.8}
        metalness={0.1}
        roughness={0.8}
      />
    </mesh>
  );
};

// Country Boundaries Component
const CountryBoundaries = () => {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  useEffect(() => {
    // Sample countries for testing
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
      },
      {
        id: 'france',
        name: 'France',
        coordinates: [
          [-5, 51], [-5, 42], [10, 42], [10, 51]
        ]
      },
      {
        id: 'japan',
        name: 'Japan',
        coordinates: [
          [129, 45], [129, 30], [146, 30], [146, 45]
        ]
      },
      {
        id: 'australia',
        name: 'Australia',
        coordinates: [
          [113, -10], [113, -44], [154, -44], [154, -10]
        ]
      }
    ];
    
    setCountries(sampleCountries);
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

// Individual Country Component
const CountryPolygon = ({ country, isSelected, onSelect }) => {
  const meshRef = useRef();
  
  const countryGeometry = useMemo(() => {
    try {
      const geometry = new THREE.PlaneGeometry(0.15, 0.15);
      
      // Calculate center of country coordinates
      const centerLat = country.coordinates.reduce((sum, coord) => sum + coord[1], 0) / country.coordinates.length;
      const centerLng = country.coordinates.reduce((sum, coord) => sum + coord[0], 0) / country.coordinates.length;
      
      // Convert to 3D position on globe
      const position = latLngToVector3(centerLat, centerLng, 1.01);
      
      // Position the geometry
      geometry.translate(position.x, position.y, position.z);
      
      // Rotate to face outward from globe center
      const lookAt = new THREE.Vector3(0, 0, 0);
      geometry.lookAt(lookAt);
      
      return geometry;
    } catch (error) {
      console.error('Error creating country geometry:', error);
      return new THREE.BoxGeometry(0.01, 0.01, 0.01);
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

// Utility function for coordinate conversion
const latLngToVector3 = (lat, lng, radius = 1) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
};

export default Globe;