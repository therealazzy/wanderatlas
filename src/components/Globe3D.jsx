import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Globe3D = ({ onClick }) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const sphereRef = useRef(null);
  const frameRef = useRef(null);
  const runningRef = useRef(true);
  const observerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg', (tex) => {
      tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      tex.minFilter = THREE.LinearMipMapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
    });

    // Lower segment count for better performance
    const geometry = new THREE.SphereGeometry(1.5, 32, 32);
    // Basic material (no lighting calculations)
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    sphereRef.current = sphere;
    scene.add(sphere);

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      rendererRef.current.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const baseSpeed = prefersReducedMotion ? 0.0008 : 0.0025;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (!runningRef.current) return;
      if (sphereRef.current) {
        sphereRef.current.rotation.y += baseSpeed;
      }
      renderer.render(scene, camera);
    };

    // Pause when not visible in viewport
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        const entry = entries[0];
        runningRef.current = !!entry?.isIntersecting;
      }, { root: null, threshold: 0.1 });
      obs.observe(container);
      observerRef.current = obs;
    }

    // Pause when tab hidden
    const visHandler = () => { runningRef.current = !document.hidden; };
    document.addEventListener('visibilitychange', visHandler);

    animate();

    const clickHandler = () => { if (typeof onClick === 'function') onClick(); };
    renderer.domElement.style.cursor = 'pointer';
    renderer.domElement.addEventListener('click', clickHandler);

    return () => {
      document.removeEventListener('visibilitychange', visHandler);
      if (observerRef.current) observerRef.current.disconnect();
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', clickHandler);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        container.removeChild(rendererRef.current.domElement);
      }
      if (sphereRef.current) {
        sphereRef.current.geometry.dispose();
        sphereRef.current.material.dispose();
      }
      sphereRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
    };
  }, [onClick]);

  return (
    <div ref={containerRef} className="w-48 h-48 md:w-64 md:h-64 mx-auto" />
  );
};

export default Globe3D; 