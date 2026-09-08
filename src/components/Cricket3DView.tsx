import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BallState, ShotResult } from '../types';

interface Cricket3DViewProps {
  ballState: BallState | null;
  onBallImpactZone?: () => void;
  lastShot?: ShotResult | null;
  isBowling: boolean;
}

export const Cricket3DView: React.FC<Cricket3DViewProps> = ({
  ballState,
  lastShot,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);
  const ballShadowRef = useRef<THREE.Mesh | null>(null);
  const seamMeshRef = useRef<THREE.Mesh | null>(null);
  const bailsRefs = useRef<THREE.Mesh[]>([]);
  const stumpsRefs = useRef<THREE.Mesh[]>([]);
  const sparksRef = useRef<THREE.Points | null>(null);
  const sparksGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const hitVelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const ballWorldPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, -22));

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = null; // Transparent so camera or stadium backdrop shows through!
    scene.fog = new THREE.FogExp2(0x060c1d, 0.015);

    // 2. Camera setup: Batsman perspective looking down the pitch towards the bowler
    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      150
    );
    camera.position.set(0, 1.7, 1.5);
    camera.lookAt(0, 1.1, -12);

    // 3. Renderer with high performance & transparency
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting: Stadium Night Floodlights (4 corners)
    const ambientLight = new THREE.AmbientLight(0x405580, 0.9);
    scene.add(ambientLight);

    const mainFloodLight = new THREE.DirectionalLight(0xffffff, 2.2);
    mainFloodLight.position.set(0, 15, 2);
    scene.add(mainFloodLight);

    const bowlerEndLight = new THREE.DirectionalLight(0x90b0ff, 1.6);
    bowlerEndLight.position.set(0, 12, -24);
    scene.add(bowlerEndLight);

    // 5. Pitch strip (22 yards = ~20.12 meters)
    const pitchWidth = 3.2;
    const pitchLength = 24;
    const pitchGeometry = new THREE.PlaneGeometry(pitchWidth, pitchLength);
    const pitchMaterial = new THREE.MeshStandardMaterial({
      color: 0x9b7f58, // Sandy clay wicket
      roughness: 0.85,
      metalness: 0.05,
    });
    const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.set(0, 0, -10);
    scene.add(pitch);

    // Crease lines (popping crease and bowling crease)
    const creaseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const popCreaseGeom = new THREE.PlaneGeometry(3.2, 0.08);
    
    // Batsman popping crease
    const popCrease = new THREE.Mesh(popCreaseGeom, creaseMat);
    popCrease.rotation.x = -Math.PI / 2;
    popCrease.position.set(0, 0.01, 0.2);
    scene.add(popCrease);

    // Bowler crease
    const bowlerCrease = new THREE.Mesh(popCreaseGeom, creaseMat);
    bowlerCrease.rotation.x = -Math.PI / 2;
    bowlerCrease.position.set(0, 0.01, -20.2);
    scene.add(bowlerCrease);

    // Turf Grass Outfield
    const outfieldGeom = new THREE.CircleGeometry(50, 48);
    const outfieldMat = new THREE.MeshStandardMaterial({
      color: 0x0c281e, // Deep night emerald grass
      roughness: 0.95,
    });
    const outfield = new THREE.Mesh(outfieldGeom, outfieldMat);
    outfield.rotation.x = -Math.PI / 2;
    outfield.position.set(0, -0.02, -10);
    scene.add(outfield);

    // 6. Wooden Wickets and Bails (Batsman's stumps behind batsman)
    const stumpMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373,
      roughness: 0.4,
    });
    const stumpGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.76, 12);

    const stumps: THREE.Mesh[] = [];
    [-0.14, 0, 0.14].forEach((offset) => {
      const stump = new THREE.Mesh(stumpGeom, stumpMat);
      stump.position.set(offset, 0.38, 1.25);
      scene.add(stump);
      stumps.push(stump);
    });
    stumpsRefs.current = stumps;

    // Bails on top of batsman's stumps
    const bailGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8);
    const bailMat = new THREE.MeshStandardMaterial({ color: 0xe6b87d });
    const bails: THREE.Mesh[] = [];
    [-0.07, 0.07].forEach((bx) => {
      const bail = new THREE.Mesh(bailGeom, bailMat);
      bail.rotation.z = Math.PI / 2;
      bail.position.set(bx, 0.77, 1.25);
      scene.add(bail);
      bails.push(bail);
    });
    bailsRefs.current = bails;

    // Bowler's End Stumps (in the distance)
    [-0.14, 0, 0.14].forEach((offset) => {
      const stump = new THREE.Mesh(stumpGeom, stumpMat);
      stump.position.set(offset, 0.38, -21);
      scene.add(stump);
    });

    // 7. 3D Cricket Ball (Red leather Kookaburra / Duke)
    const ballRadius = 0.065; // ~7.1cm diameter
    const ballGeom = new THREE.SphereGeometry(ballRadius, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // High-gloss cherry red
      roughness: 0.25,
      metalness: 0.1,
      emissive: 0x220505,
    });
    const ballMesh = new THREE.Mesh(ballGeom, ballMat);
    scene.add(ballMesh);
    ballMeshRef.current = ballMesh;

    // White seam ring around the ball
    const seamGeom = new THREE.TorusGeometry(ballRadius + 0.002, 0.005, 12, 48);
    const seamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const seamMesh = new THREE.Mesh(seamGeom, seamMat);
    ballMesh.add(seamMesh);
    seamMeshRef.current = seamMesh;

    // Ball dynamic shadow on pitch
    const shadowGeom = new THREE.CircleGeometry(0.08, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.6,
    });
    const ballShadow = new THREE.Mesh(shadowGeom, shadowMat);
    ballShadow.rotation.x = -Math.PI / 2;
    ballShadow.position.set(0, 0.015, -20);
    scene.add(ballShadow);
    ballShadowRef.current = ballShadow;

    // 8. Particle Sparks for Bat Impact
    const sparksCount = 60;
    const sparkPositions = new Float32Array(sparksCount * 3);
    const sparkVelocities = new Float32Array(sparksCount * 3);
    for (let i = 0; i < sparksCount; i++) {
      sparkPositions[i * 3] = 0;
      sparkPositions[i * 3 + 1] = -100; // hidden initially
      sparkPositions[i * 3 + 2] = 0;

      sparkVelocities[i * 3] = (Math.random() - 0.5) * 8;
      sparkVelocities[i * 3 + 1] = Math.random() * 6 + 2;
      sparkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    const sparksGeo = new THREE.BufferGeometry();
    sparksGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    sparksGeo.setAttribute('velocity', new THREE.BufferAttribute(sparkVelocities, 3));
    sparksGeoRef.current = sparksGeo;

    const sparksMat = new THREE.PointsMaterial({
      color: 0xffd700, // Gold energy sparks
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const sparks = new THREE.Points(sparksGeo, sparksMat);
    scene.add(sparks);
    sparksRef.current = sparks;

    // 9. Resize observer
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 10. Animation render loop
    let animId: number;
    let clock = new THREE.Clock();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const delta = clock.getDelta();

      // Update particle sparks if active
      if (sparksRef.current && sparksGeoRef.current) {
        const posAttr = sparksGeoRef.current.getAttribute('position') as THREE.BufferAttribute;
        const velAttr = sparksGeoRef.current.getAttribute('velocity') as THREE.BufferAttribute;
        if (posAttr && velAttr) {
          const pos = posAttr.array as Float32Array;
          const vel = velAttr.array as Float32Array;
          let anyActive = false;

          for (let i = 0; i < pos.length / 3; i++) {
            if (pos[i * 3 + 1] > -10) {
              pos[i * 3] += vel[i * 3] * delta;
              pos[i * 3 + 1] += vel[i * 3 + 1] * delta;
              pos[i * 3 + 2] += vel[i * 3 + 2] * delta;
              vel[i * 3 + 1] -= 9.8 * delta; // gravity
              anyActive = true;
            }
          }
          if (anyActive) {
            posAttr.needsUpdate = true;
          }
        }
      }

      // Ball rotational spin
      if (ballMeshRef.current) {
        ballMeshRef.current.rotation.x += 12 * delta;
        ballMeshRef.current.rotation.y += 8 * delta;
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Ball Position and Physics according to BallState
  useEffect(() => {
    if (!ballMeshRef.current || !ballShadowRef.current) return;

    if (!ballState || !ballState.active) {
      // Park ball invisibly behind bowler
      ballMeshRef.current.position.set(0, -10, -22);
      ballShadowRef.current.position.set(0, -10, -22);
      return;
    }

    const { progress, lineOffset, isHit, isMissed, hitResult } = ballState;

    if (isHit && hitResult) {
      // Ball has been hit! Realistic trajectory based on shot
      // FOUR: low screaming drive; SIX: soaring high arc
      const isSix = hitResult.type === 'SIX';
      const isFour = hitResult.type === 'FOUR';

      const postHitProgress = Math.max(0, progress - 1.0) * 3.5; // accelerates into outfield
      const horizontalDir = hitResult.shotName.includes('Cover') || hitResult.shotName.includes('Cut')
        ? -1.2 // off-side (left from batsman view)
        : hitResult.shotName.includes('Pull') || hitResult.shotName.includes('Flick')
        ? 1.2  // on/leg-side (right)
        : 0.1; // straight drive

      const speedFactor = (hitResult.speedKph || 135) / 100;
      const targetZ = -22 - postHitProgress * 28 * speedFactor;
      const targetX = horizontalDir * postHitProgress * 18 * speedFactor;
      
      let targetY = 1.0;
      if (isSix) {
        // Parabolic high six trajectory
        targetY = 1.0 + Math.sin(Math.min(Math.PI, postHitProgress * Math.PI * 0.5)) * 14;
      } else if (isFour) {
        // Low blazing boundary drive, skips on the turf
        targetY = Math.max(0.1, 0.8 - postHitProgress * 0.4);
      } else {
        targetY = Math.max(0.1, 0.9 + postHitProgress * 0.8 - postHitProgress * postHitProgress * 1.5);
      }

      ballMeshRef.current.position.set(targetX, targetY, targetZ);
      ballShadowRef.current.position.set(targetX, 0.015, targetZ);
      const shadowScale = Math.max(0.2, 1.5 - targetY * 0.25);
      ballShadowRef.current.scale.set(shadowScale, shadowScale, shadowScale);

      // Trigger spark particles at bat contact (progress right around 1.0)
      if (progress >= 1.0 && progress < 1.06 && sparksGeoRef.current) {
        const posAttr = sparksGeoRef.current.getAttribute('position') as THREE.BufferAttribute;
        const pos = posAttr.array as Float32Array;
        for (let i = 0; i < pos.length / 3; i++) {
          pos[i * 3] = ballMeshRef.current.position.x;
          pos[i * 3 + 1] = ballMeshRef.current.position.y;
          pos[i * 3 + 2] = ballMeshRef.current.position.z;
        }
        posAttr.needsUpdate = true;
      }
      return;
    }

    if (isMissed) {
      // Ball passed batsman and smashed into wickets or keeper!
      const postMissProgress = Math.max(0, progress - 1.0);
      const bZ = 0.2 + postMissProgress * 6;
      ballMeshRef.current.position.set(lineOffset * 0.2, 0.65, bZ);

      // Knock bails and stumps if bowled (centered delivery)
      if (Math.abs(lineOffset) < 0.25) {
        bailsRefs.current.forEach((bail, idx) => {
          bail.position.y += postMissProgress * 4;
          bail.rotation.x += postMissProgress * 10;
          bail.position.x += (idx === 0 ? -1 : 1) * postMissProgress * 2;
        });
        stumpsRefs.current.forEach((stump, idx) => {
          stump.rotation.x = -postMissProgress * 1.4;
          stump.position.z = 1.25 + postMissProgress * 1.5;
        });
      }
      return;
    }

    // Standard Bowler Delivery trajectory (Z from -21m to 0m)
    // Pitch bounce happens at progress ~ 0.58 (approx 7 meters in front of batsman)
    const bounceProgress = 0.58;
    const startZ = -21;
    const endZ = 0.2; // batsman strike zone
    const currentZ = startZ + progress * (endZ - startZ);

    // Lateral swing in the air
    const swingCurve = Math.sin(progress * Math.PI) * 0.35;
    const currentX = lineOffset * 0.8 + swingCurve;

    // Vertical trajectory with bounce
    let currentY: number;
    if (progress < bounceProgress) {
      // Downwards trajectory from bowler hand (release at 2.1m) towards pitch bounce spot
      const p = progress / bounceProgress;
      currentY = 2.1 - p * 2.02; // hits pitch at ~0.08m
    } else {
      // Post-bounce rising ball up to batsman waist/chest height (0.8m - 1.1m)
      const p = (progress - bounceProgress) / (1.0 - bounceProgress);
      // Parabolic rise
      currentY = 0.08 + p * 0.95 - p * p * 0.25;
    }

    ballMeshRef.current.position.set(currentX, Math.max(0.08, currentY), currentZ);
    ballShadowRef.current.position.set(currentX, 0.015, currentZ);
    
    // Scale shadow with altitude
    const shadowScale = Math.max(0.3, 1.4 - currentY * 0.5);
    ballShadowRef.current.scale.set(shadowScale, shadowScale, shadowScale);
  }, [ballState]);

  // Reset stumps if new ball starts
  useEffect(() => {
    if (ballState && ballState.progress < 0.1) {
      stumpsRefs.current.forEach((stump, idx) => {
        const offset = [-0.14, 0, 0.14][idx];
        stump.position.set(offset, 0.38, 1.25);
        stump.rotation.set(0, 0, 0);
      });
      bailsRefs.current.forEach((bail, idx) => {
        const bx = [-0.07, 0.07][idx];
        bail.position.set(bx, 0.77, 1.25);
        bail.rotation.set(0, 0, Math.PI / 2);
      });
    }
  }, [ballState?.id]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
    />
  );
};
