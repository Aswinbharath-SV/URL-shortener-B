import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const SERVER_LOCATION = { lat: 40.7128, lng: -74.0060 }; // NYC Server Location
const RADIUS = 1.8;

// Coordinate converter helper: maps Latitude/Longitude to 3D Sphere points
const latLngToVector3 = (lat, lng, radius) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return new THREE.Vector3(x, y, z);
};

const TrafficGlobe = ({ clicksList = [], width = 300, height = 300 }) => {
  const mountRef = useRef(null);
  const clicksRef = useRef([]);

  // Keep a mutable ref of current clicks so the animation loop always sees the latest ones
  useEffect(() => {
    clicksRef.current = clicksList;
  }, [clicksList]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5.2;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group to hold all globe objects (for rotating them together)
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 2. BUILD THE GLOBE
    // Wireframe Outer Mesh
    const sphereGeometry = new THREE.SphereGeometry(RADIUS, 38, 38);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x6366f1, // Indigo-500
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const globeWire = new THREE.Mesh(sphereGeometry, sphereMaterial);
    globeGroup.add(globeWire);

    // Inner Core Glow
    const coreGeometry = new THREE.SphereGeometry(RADIUS * 0.98, 20, 20);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x0c101d,
      transparent: true,
      opacity: 0.7,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    globeGroup.add(coreMesh);

    // Latitude/Longitude Grid Lines (Faint lines)
    const gridGeometry = new THREE.SphereGeometry(RADIUS * 1.005, 12, 12);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x818cf8, // Indigo-400
      wireframe: true,
      transparent: true,
      opacity: 0.05,
    });
    const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
    globeGroup.add(gridMesh);

    // 3. ANCHOR SERVER MARKER
    const serverPos = latLngToVector3(SERVER_LOCATION.lat, SERVER_LOCATION.lng, RADIUS);
    
    // Server glowing ring
    const serverGeom = new THREE.SphereGeometry(0.06, 12, 12);
    const serverMat = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Emerald green server node
      transparent: true,
      opacity: 0.9
    });
    const serverMesh = new THREE.Mesh(serverGeom, serverMat);
    serverMesh.position.copy(serverPos);
    globeGroup.add(serverMesh);

    // 4. MANAGE DYNAMIC ARCS AND PARTICLES
    const activeArcs = [];
    const activeParticles = [];

    // Maps a list of coordinates to actual lines and particles
    const addTrafficPath = (lat, lng, colorHex = 0xec4899) => {
      // Avoid rendering if coordinates are invalid
      if (!lat || !lng || (lat === 0 && lng === 0)) return;

      const origin = latLngToVector3(lat, lng, RADIUS);
      const dest = serverPos;

      // Draw client marker dot
      const clientGeom = new THREE.SphereGeometry(0.04, 8, 8);
      const clientMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.8
      });
      const clientMesh = new THREE.Mesh(clientGeom, clientMat);
      clientMesh.position.copy(origin);
      globeGroup.add(clientMesh);

      // Create quadratic Bezier curve
      const midPoint = new THREE.Vector3().addVectors(origin, dest).multiplyScalar(0.5);
      const dist = origin.distanceTo(dest);
      midPoint.normalize().multiplyScalar(RADIUS + dist * 0.35); // peak of path arc

      const curve = new THREE.QuadraticBezierCurve3(origin, midPoint, dest);
      const points = curve.getPoints(24);

      // Line mesh
      const pathGeom = new THREE.BufferGeometry().setFromPoints(points);
      const pathMat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.35,
        linewidth: 1,
      });
      const pathLine = new THREE.Line(pathGeom, pathMat);
      globeGroup.add(pathLine);
      activeArcs.push({ mesh: pathLine, clientMesh });

      // Traveling light particle on path
      const particleGeom = new THREE.SphereGeometry(0.03, 6, 6);
      const particleMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });
      const particle = new THREE.Mesh(particleGeom, particleMat);
      globeGroup.add(particle);

      activeParticles.push({
        mesh: particle,
        curve,
        progress: 0,
        speed: 0.015 + Math.random() * 0.01,
      });

      // Limit active elements in group to prevent memory overhead
      if (activeArcs.length > 25) {
        const oldest = activeArcs.shift();
        globeGroup.remove(oldest.mesh);
        globeGroup.remove(oldest.clientMesh);
        oldest.mesh.geometry.dispose();
        oldest.mesh.material.dispose();
        oldest.clientMesh.geometry.dispose();
        oldest.clientMesh.material.dispose();
      }
    };

    // Parse lat/lng array map
    const mappedGeoList = [
      { lat: 35.6762, lng: 139.6503, col: 0xec4899 }, // Tokyo
      { lat: 51.5074, lng: -0.1278, col: 0x3b82f6 },  // London
      { lat: 12.9716, lng: 77.5946, col: 0x10b981 },   // Bangalore
      { lat: -33.8688, lng: 151.2093, col: 0xf59e0b }  // Sydney
    ];

    // Seed initial paths so the globe is instantly populated with stunning activity arcs
    mappedGeoList.forEach((item) => {
      addTrafficPath(item.lat, item.lng, item.col);
    });

    // Listen for new clicks array updates and dynamically generate paths
    let processedClicksCount = 0;
    const processNewClicks = () => {
      const currentList = clicksRef.current;
      if (currentList.length > processedClicksCount) {
        for (let i = processedClicksCount; i < currentList.length; i++) {
          const c = currentList[i];
          // Check standard country coordinates
          const countryCoords = {
            'united states': { lat: 37.0902, lng: -95.7129 },
            'united kingdom': { lat: 55.3781, lng: -3.4360 },
            'india': { lat: 20.5937, lng: 78.9629 },
            'germany': { lat: 51.1657, lng: 10.4515 },
            'france': { lat: 46.2276, lng: 2.2137 },
            'canada': { lat: 56.1304, lng: -106.3468 },
            'australia': { lat: -25.2744, lng: 133.7751 },
            'japan': { lat: 36.2048, lng: 138.2529 },
            'singapore': { lat: 1.3521, lng: 103.8198 },
            'netherlands': { lat: 52.1326, lng: 5.2913 }
          };

          const geoKey = (c.country || '').toLowerCase();
          const coord = countryCoords[geoKey] || { lat: 15 + Math.random() * 30, lng: -20 + Math.random() * 100 }; // fallback
          
          addTrafficPath(coord.lat, coord.lng, c.isSuspicious ? 0xef4444 : 0x6366f1);
        }
        processedClicksCount = currentList.length;
      }
    };

    // 5. ANIMATION LOOP
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Rotate Globe
      globeGroup.rotation.y += 0.0028;
      globeGroup.rotation.x = 0.15; // static tilt

      // Process live clicks additions
      processNewClicks();

      // Update light particle paths
      for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.progress += p.speed;

        if (p.progress >= 1.0) {
          // Loop progress or delete particle and spawn new one
          p.progress = 0;
        }

        // Calculate position on curve
        const pos = p.curve.getPointAt(p.progress);
        p.mesh.position.copy(pos);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 6. CLEAN UP
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      
      // Dispose geometry and materials
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      gridGeometry.dispose();
      gridMaterial.dispose();
      serverGeom.dispose();
      serverMat.dispose();

      activeArcs.forEach((a) => {
        a.mesh.geometry.dispose();
        a.mesh.material.dispose();
        a.clientMesh.geometry.dispose();
        a.clientMesh.material.dispose();
      });

      activeParticles.forEach((p) => {
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      });

      renderer.dispose();
    };
  }, [width, height]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Ambient glowing shadow under the globe */}
      <div className="absolute h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none -z-10"></div>
      <div ref={mountRef} className="cursor-grab active:cursor-grabbing" style={{ width, height }} />
    </div>
  );
};

export default TrafficGlobe;
