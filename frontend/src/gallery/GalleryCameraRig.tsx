import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Vector3 } from 'three';
import type { CraftObject } from '../types';

interface GalleryCameraRigProps {
  selectedObject: CraftObject | null;
}

export const GalleryCameraRig = ({ selectedObject }: GalleryCameraRigProps) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Default grand gallery overview coordinates
  const overviewCamPos = useRef(new Vector3(0, 1.4, 8.2));
  const overviewLookAt = useRef(new Vector3(0, 0.05, 0));

  const targetCamPos = useRef(new Vector3(0, 1.4, 8.2));
  const targetLookAt = useRef(new Vector3(0, 0.05, 0));
  const isTransitioning = useRef(false);
  const transitionTime = useRef(0);

  // Trigger smooth cinematic camera glide whenever selection changes
  useEffect(() => {
    if (selectedObject) {
      const ox = selectedObject.position3D?.[0] ?? 0;
      const oy = selectedObject.position3D?.[1] ?? 0.2;
      const oz = selectedObject.position3D?.[2] ?? 0;
      targetLookAt.current.set(ox, oy + 0.1, oz);

      // Angle the camera slightly based on object's horizontal position for cinematic composition
      const angleOffset = Math.atan2(ox, 7.5) * 0.35;
      targetCamPos.current.set(
        ox + Math.sin(angleOffset) * 0.45,
        oy + 0.32,
        oz + 2.45
      );
    } else {
      targetLookAt.current.copy(overviewLookAt.current);
      targetCamPos.current.copy(overviewCamPos.current);
    }

    isTransitioning.current = true;
    transitionTime.current = 0;
  }, [selectedObject]);

  useFrame((_, delta) => {
    if (isTransitioning.current) {
      transitionTime.current += delta;
      
      // Smooth damp lerp towards target camera position & look-at point
      camera.position.lerp(targetCamPos.current, 0.075);

      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, 0.08);
        controlsRef.current.update();
      }

      // Once the camera is within close tolerance of the target, release continuous lerping
      // so OrbitControls allows the user to freely orbit and inspect without snapping back
      const dist = camera.position.distanceTo(targetCamPos.current);
      if (transitionTime.current > 1.2 || dist < 0.03) {
        isTransitioning.current = false;
      }
    } else if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2 - 0.03}
      minPolarAngle={Math.PI / 6}
      minDistance={1.3}
      maxDistance={13}
      rotateSpeed={0.65}
      panSpeed={0.4}
      screenSpacePanning
    />
  );
};

