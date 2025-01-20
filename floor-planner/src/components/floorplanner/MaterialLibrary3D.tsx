import React, {
  createContext,
  useContext,
  PropsWithChildren,
  useMemo
} from "react";
import { TextureLoader, MeshStandardMaterial, Texture } from "three";
import { MaterialData } from "../../types";
import { useLoader } from "@react-three/fiber";

/**
 * MaterialLibrary3D
 * - Now handles invalid or empty texture URLs gracefully.
 */

interface MaterialLibraryProps {
  materials: MaterialData[];
}

interface MaterialMap {
  [id: string]: MeshStandardMaterial;
}

const MaterialLibraryContext = createContext<MaterialMap>({});

export const MaterialLibrary3D: React.FC<PropsWithChildren<MaterialLibraryProps>> = ({
  materials,
  children
}) => {
  const diffuseURLs = materials.map((m) => m.diffuseMap || "");
  const normalURLs = materials.map((m) => m.normalMap || "");

  // Try/catch to handle possible loader errors
  let loadedDiffuse: Texture[] = [];
  let loadedNormal: Texture[] = [];
  try {
    loadedDiffuse = useLoader(TextureLoader, diffuseURLs) as Texture[];
    loadedNormal = useLoader(TextureLoader, normalURLs) as Texture[];
  } catch (err) {
    // fallback empty arrays
    loadedDiffuse = [];
    loadedNormal = [];
  }

  const materialMap: MaterialMap = useMemo(() => {
    const map: MaterialMap = {};
    materials.forEach((matData, index) => {
      const colorVal = matData.color || "#ffffff";
      const mat = new MeshStandardMaterial({ color: colorVal });
      if (diffuseURLs[index]) {
        mat.map = loadedDiffuse[index];
        if (mat.map) {
          mat.map.wrapS = 1000;
          mat.map.wrapT = 1000;
        }
      }
      if (normalURLs[index]) {
        mat.normalMap = loadedNormal[index];
        if (mat.normalMap) {
          mat.normalMap.wrapS = 1000;
          mat.normalMap.wrapT = 1000;
        }
      }
      map[matData.id] = mat;
    });
    return map;
  }, [materials, loadedDiffuse, loadedNormal, diffuseURLs, normalURLs]);

  return (
    <MaterialLibraryContext.Provider value={materialMap}>
      {children}
    </MaterialLibraryContext.Provider>
  );
};

export function useMaterial(materialId?: string): MeshStandardMaterial | null {
  const map = useContext(MaterialLibraryContext);
  if (!materialId) return null;
  return map[materialId] || null;
}