import { PROTOTYPING_ASSETS } from "../engine/utils/prototypingAssets";

export interface CameraState {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
  showGrid?: boolean;
}

export interface ShotKeyframe {
  id: string;
  name: string;
  x: number;
  y: number;
  scale: number;
  duration: number;
  transitionType?: string;
  ease?: string;
}

export interface TimelineState {
  shots: ShotKeyframe[];
  duration: number;
  tracks?: any[];
}

export interface SceneSettingsState {
  width: number;
  height: number;
  bgColor: string;
  texture: string;
  formatPreset?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  title: string;
  createdAt: string;
  lastModified: string;
  elements: any[];
  assets?: any[];
  camera: CameraState;
  timeline: TimelineState;
  shots?: ShotKeyframe[];
  sceneSettings: SceneSettingsState;
}

export type Project = ProjectData;

const STORAGE_KEY = "kanto_projects";

export const DEFAULT_CAMERA: CameraState = {
  x: 1465,
  y: 960,
  scale: 1,
  width: 270,
  height: 480,
  showGrid: true,
};

export const DEFAULT_SCENE_SETTINGS: SceneSettingsState = {
  width: 3200,
  height: 2400,
  bgColor: "#FFFFFF",
  texture: "lines",
};

export const DEFAULT_TIMELINE: TimelineState = {
  shots: [],
  duration: 5.0,
};

const DEFAULT_PROJECTS: ProjectData[] = [
  {
    id: "1",
    name: "Neon Genesis",
    title: "Neon Genesis",
    createdAt: "2026-08-10T12:00:00.000Z",
    lastModified: "2026-08-10T12:00:00.000Z",
    elements: [],
    assets: [],
    camera: { ...DEFAULT_CAMERA },
    shots: [],
    timeline: { shots: [], duration: 5.0 },
    sceneSettings: { ...DEFAULT_SCENE_SETTINGS },
  },
  {
    id: "2",
    name: "Void Walker",
    title: "Void Walker",
    createdAt: "2026-08-12T15:30:00.000Z",
    lastModified: "2026-08-12T15:30:00.000Z",
    elements: [],
    assets: [],
    camera: { ...DEFAULT_CAMERA },
    shots: [],
    timeline: { shots: [], duration: 5.0 },
    sceneSettings: { ...DEFAULT_SCENE_SETTINGS },
  },
  {
    id: "3",
    name: "Silhouette",
    title: "Silhouette",
    createdAt: "2026-08-14T09:00:00.000Z",
    lastModified: "2026-08-14T09:00:00.000Z",
    elements: [],
    assets: [],
    camera: { ...DEFAULT_CAMERA },
    shots: [],
    timeline: { shots: [], duration: 5.0 },
    sceneSettings: { ...DEFAULT_SCENE_SETTINGS },
  },
];

/**
 * Re-hydrate serialized elements (e.g. re-attaching renderSvg closures on SVG shapes).
 */
export function hydrateAssets(elements: any[]): any[] {
  if (!Array.isArray(elements)) return [];
  return elements.map((asset) => {
    if (!asset || typeof asset !== "object") return asset;

    // If it's an SVG asset whose renderSvg function was lost during JSON serialization
    if (asset.type === "svg" && typeof asset.renderSvg !== "function") {
      const template = PROTOTYPING_ASSETS.find(
        (p: any) =>
          p.id === asset.assetTemplateId ||
          p.id === asset.id ||
          p.name === asset.name
      );

      if (template && typeof template.renderSvg === "function") {
        return {
          ...asset,
          renderSvg: template.renderSvg,
        };
      }

      // Safe fallback SVG renderer
      return {
        ...asset,
        renderSvg: (
          color = asset.color || "#3b82f6",
          borderColor = asset.borderColor || "#ffffff",
          borderWidth = asset.borderWidth !== undefined ? asset.borderWidth : 3,
          hasBorder = asset.hasBorder || false
        ) => `
          <svg viewBox="0 0 ${asset.width || 160} ${asset.height || 160}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="5" width="${(asset.width || 160) - 10}" height="${(asset.height || 160) - 10}" rx="6" fill="${color}" stroke="${hasBorder ? borderColor : "none"}" stroke-width="${hasBorder ? borderWidth : 0}"/>
          </svg>
        `,
      };
    }

    return asset;
  });
}

/**
 * Retrieve all projects from localStorage.
 */
export function getProjects(): ProjectData[] {
  if (typeof window === "undefined") return DEFAULT_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROJECTS));
      return DEFAULT_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROJECTS));
      return DEFAULT_PROJECTS;
    }
    return parsed;
  } catch (err) {
    console.error("[projectStore] Failed to read projects:", err);
    return DEFAULT_PROJECTS;
  }
}

/**
 * Retrieve a specific project by its ID with elements fully hydrated.
 */
export function getProject(id: string): ProjectData | null {
  const projects = getProjects();
  const found = projects.find((p) => p.id === id);
  if (!found) return null;

  const rawElements = found.elements || found.assets || [];
  return {
    ...found,
    elements: hydrateAssets(rawElements),
    assets: hydrateAssets(rawElements),
    camera: found.camera || { ...DEFAULT_CAMERA },
    shots: found.shots || found.timeline?.shots || [],
    timeline: found.timeline || {
      shots: found.shots || [],
      duration: 5.0,
    },
    sceneSettings: found.sceneSettings || { ...DEFAULT_SCENE_SETTINGS },
  };
}

/**
 * Save or update a project in localStorage.
 */
export function saveProject(
  projectUpdate: Partial<ProjectData> & { id: string }
): ProjectData {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === projectUpdate.id);
  const now = new Date().toISOString();

  let updated: ProjectData;

  const rawElements =
    projectUpdate.elements || projectUpdate.assets;

  if (index >= 0) {
    const existing = projects[index]!;
    const elementsToSave = rawElements !== undefined ? rawElements : (existing.elements || existing.assets || []);
    const shotsToSave = projectUpdate.shots !== undefined ? projectUpdate.shots : (projectUpdate.timeline?.shots || existing.shots || existing.timeline?.shots || []);

    updated = {
      ...existing,
      ...projectUpdate,
      name: projectUpdate.name || projectUpdate.title || existing.name,
      title: projectUpdate.title || projectUpdate.name || existing.title,
      elements: elementsToSave,
      assets: elementsToSave,
      shots: shotsToSave,
      camera: projectUpdate.camera || existing.camera || { ...DEFAULT_CAMERA },
      timeline: projectUpdate.timeline || existing.timeline || { shots: shotsToSave, duration: 5.0 },
      sceneSettings: projectUpdate.sceneSettings || existing.sceneSettings || { ...DEFAULT_SCENE_SETTINGS },
      lastModified: now,
    };
    projects[index] = updated;
  } else {
    const elementsToSave = rawElements || [];
    const shotsToSave = projectUpdate.shots || projectUpdate.timeline?.shots || [];
    const projectName = projectUpdate.name || projectUpdate.title || "Untitled Motion";

    updated = {
      id: projectUpdate.id,
      name: projectName,
      title: projectName,
      createdAt: projectUpdate.createdAt || now,
      lastModified: now,
      elements: elementsToSave,
      assets: elementsToSave,
      camera: projectUpdate.camera || { ...DEFAULT_CAMERA },
      shots: shotsToSave,
      timeline: projectUpdate.timeline || { shots: shotsToSave, duration: 5.0 },
      sceneSettings: projectUpdate.sceneSettings || { ...DEFAULT_SCENE_SETTINGS },
      ...projectUpdate,
    };
    projects.unshift(updated);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (err) {
      console.error("[projectStore] Failed to save project:", err);
    }
  }

  return updated;
}

/**
 * Create a new project entity and store it in localStorage.
 */
export function createProject(
  name: string = "Untitled Motion",
  explicitId?: string
): ProjectData {
  const id = explicitId || Date.now().toString();
  const now = new Date().toISOString();

  const newProject: ProjectData = {
    id,
    name,
    title: name,
    createdAt: now,
    lastModified: now,
    elements: [],
    assets: [],
    camera: { ...DEFAULT_CAMERA },
    shots: [],
    timeline: { shots: [], duration: 5.0 },
    sceneSettings: { ...DEFAULT_SCENE_SETTINGS },
  };

  const projects = getProjects();
  const existingIdx = projects.findIndex((p) => p.id === id);
  if (existingIdx >= 0) {
    projects[existingIdx] = newProject;
  } else {
    projects.unshift(newProject);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (err) {
      console.error("[projectStore] Failed to create project:", err);
    }
  }

  return newProject;
}

/**
 * Delete a project by ID from localStorage.
 */
export function deleteProject(id: string): void {
  if (typeof window === "undefined") return;
  const projects = getProjects().filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error("[projectStore] Failed to delete project:", err);
  }
}
