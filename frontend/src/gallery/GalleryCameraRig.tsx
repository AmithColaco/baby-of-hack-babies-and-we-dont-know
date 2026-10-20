import { useRef } from 'react';
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

  const targetCamPos = useRef(new Vector3(0, 1.2, 8.5));
  const targetLookAt = useRef(new Vector3(0, 0.1, 0));

  useFrame(() => {
    if (selectedObject) {
      const [ox, oy, oz] = selectedObject.position3D;
      targetCamPos.current.set(ox, oy + 0.15, oz + 2.5);
      targetLookAt.current.set(ox, oy + 0.05, oz);
    } else {
      targetCamPos.current.set(0, 1.2, 8.5);
      targetLookAt.current.set(0, 0.1, 0);
    }

    camera.position.lerp(targetCamPos.current, 0.055);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.06);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2 - 0.02}
      minPolarAngle={Math.PI / 6}
      minDistance={1.8}
      maxDistance={12}
      rotateSpeed={0.65}
      panSpeed={0.5}
      screenSpacePanning
    />
  );
};
