import * as THREE from 'three';

// Convert latitude/longitude to 3D position on a sphere
export const latLngToVector3 = (lat, lng, radius = 1) => {
  // Convert degrees to radians
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  // Convert spherical coordinates to 3D Cartesian coordinates
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
};

// Convert a country's boundary coordinates to 3D geometry
export const createCountryGeometry = (coordinates, radius = 1) => {
  const shape = new THREE.Shape();
  const holes = [];
  

  if (Array.isArray(coordinates)) {
    if (typeof coordinates[0] === 'number') {

      const point = latLngToVector3(coordinates[1], coordinates[0], radius);
      shape.moveTo(point.x, point.y);
    } else {
      coordinates.forEach((coord, index) => {
        const point = latLngToVector3(coord[1], coord[0], radius);
        if (index === 0) {
          shape.moveTo(point.x, point.y);
        } else {
          shape.lineTo(point.x, point.y);
        }
      });
    }
  }
  
  
  const geometry = new THREE.ShapeGeometry(shape);
  return geometry;
};