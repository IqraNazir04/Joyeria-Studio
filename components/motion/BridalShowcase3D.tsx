"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const MODEL_URL = "/models/bridal-showcase.glb";

/** A contained dark studio stage with a slowly auto-rotating bridal piece —
 * the same three-point-lit, bloom-lit "jewel on black marble" look a real
 * catalog shoot would use. Lazy: the WebGL scene and the 3.5MB model only
 * load once this panel scrolls near the viewport, so a visitor who never
 * reaches "Our Story" never pays for either. */
export default function BridalShowcase3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const host = canvasHostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // WebGL can be unavailable (disabled by the user, a locked-down browser,
    // a headless environment) — THREE.WebGLRenderer throws synchronously in
    // that case rather than failing gracefully, so this has to be caught
    // here or it crashes the whole effect and leaves the panel blank forever.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.72;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 2.9, 11.5);
    camera.lookAt(0, 1.0, 0.45);

    // Softer, lower-intensity three-point rig than a straight port of the
    // reference scene — the original blew out the platform's specular
    // highlight into a hard white glare and turned every small gold point
    // into a bloom-streaked "sparkle cross" instead of reading as jewelry.
    const key = new THREE.SpotLight(0xfff0dc, 26, 25, 0.5, 1, 1.6);
    key.position.set(2.5, 7, 5.5);
    key.target.position.set(0, 1, 0.4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0004;
    key.shadow.radius = 3;
    scene.add(key, key.target);

    const fill = new THREE.DirectionalLight(0xdfe6ff, 0.3);
    fill.position.set(-5, 3, 4);
    scene.add(fill);

    const rim = new THREE.SpotLight(0xffd6a8, 16, 20, 0.7, 1, 1.4);
    rim.position.set(-2, 5, -5);
    rim.target.position.set(0, 1.2, 0);
    scene.add(rim, rim.target);

    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x06120c, 0.18));

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(6, 64),
      new THREE.ShadowMaterial({ opacity: 0.4 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.225;
    floor.receiveShadow = true;
    scene.add(floor);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // A trace of bloom for a bit of jewelry sparkle, without the harsh
    // streaking a stronger pass leaves on every small highlight.
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.06, 0.2, 0.995);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    function resize() {
      const w = host!.clientWidth;
      const h = host!.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.position.setLength(camera.aspect < 1 ? 9.2 / camera.aspect : 12.5);
      camera.lookAt(0, 1.0, 0.45);
      camera.updateProjectionMatrix();
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let disposed = false;
    let modelGroup: THREE.Object3D | null = null;

    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        if (disposed) return;
        const root = gltf.scene;
        root.traverse((o) => {
          if (!(o instanceof THREE.Mesh)) return;
          o.castShadow = true;
          o.receiveShadow = true;
        });
        scene.add(root);
        modelGroup = root;
        setReady(true);
      },
      undefined,
      () => {
        if (!disposed) setFailed(true);
      }
    );

    let frameId: number;
    const clock = new THREE.Clock();
    function animate() {
      frameId = requestAnimationFrame(animate);
      if (modelGroup && !reduceMotion) {
        modelGroup.rotation.y += clock.getDelta() * 0.35;
      }
      composer.render();
    }
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      composer.dispose();
      renderer.dispose();
      pmrem.dispose();
      host?.removeChild(renderer.domElement);
    };
  }, [inView]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-4/5 w-full overflow-hidden rounded-2xl shadow-xl"
      style={{ background: "radial-gradient(120% 90% at 50% 38%, #10231b 0%, #060b09 62%)" }}
    >
      <div
        ref={canvasHostRef}
        className={`h-full w-full transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`}
      />
      {failed && (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs tracking-wide text-[#e6bd5c]/70">
          The showcase couldn&apos;t load — refresh to try again.
        </p>
      )}
    </div>
  );
}
