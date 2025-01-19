import React, {
  createContext,
  useContext,
  useMemo,
  PropsWithChildren
} from "react";
import { TextureLoader, MeshStandardMaterial, Texture } from "three";
import { MaterialData } from "../../types";
import { useLoader } from "@react-three/fiber";

interface MaterialLibraryProps {
  materials: MaterialData[];
}

interface MaterialMap {
  [id: string]: MeshStandardMaterial;
}

const MaterialLibraryContext = createContext<MaterialMap>({});

/**
 * MaterialLibrary3D
 * Provides a React context for referencing preloaded 3D materials by ID.
 * 
 * Usage:
 * <MaterialLibrary3D materials={someMaterials}>
 *   <Your3DScene />
 * </MaterialLibrary3D>
 */
export const MaterialLibrary3D: React.FC<PropsWithChildren<MaterialLibraryProps>> = ({
  materials,
  children
}) => {
  const diffuseURLs = materials.map((m) => m.diffuseMap || "");
  const normalURLs = materials.map((m) => m.normalMap || "");

  // These arrays align with the materials array
  const loadedDiffuse = useLoader(TextureLoader, diffuseURLs) as Texture[];
  const loadedNormal = useLoader(TextureLoader, normalURLs) as Texture[];

  /**
   * Build a map of MeshStandardMaterial keyed by material ID.
   */
  const materialMap: MaterialMap = useMemo(() => {
    const map: MaterialMap = {};
    materials.forEach((matData, index) => {
      const diffuseURL = matData.diffuseMap || "";
      const normalURL = matData.normalMap || "";
      const diffuseTexture = diffuseURL ? loadedDiffuse[index] : null;
      const normalTexture = normalURL ? loadedNormal[index] : null;

      const mat = new MeshStandardMaterial({
        color: matData.color || "#ffffff"
      });
      if (diffuseTexture) {
        mat.map = diffuseTexture;
        if (mat.map) {
          mat.map.wrapS = 1000; // RepeatWrapping if needed
          mat.map.wrapT = 1000;
        }
      }
      if (normalTexture) {
        mat.normalMap = normalTexture;
        if (mat.normalMap) {
          mat.normalMap.wrapS = 1000;
          mat.normalMap.wrapT = 1000;
        }
      }
      map[matData.id] = mat;
    });
    return map;
  }, [materials, loadedDiffuse, loadedNormal]);

  return (
    <MaterialLibraryContext.Provider value={materialMap}>
      {children}
    </MaterialLibraryContext.Provider>
  );
};

/**
 * useMaterial
 * Hook for retrieving a preloaded MeshStandardMaterial by materialId.
 */
export function useMaterial(materialId?: string): MeshStandardMaterial | null {
  const map = useContext(MaterialLibraryContext);
  if (!materialId) return null;
  return map[materialId] || null;
}