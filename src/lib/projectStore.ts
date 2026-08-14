export interface Project {
  id: string;
  name: string;
  title: string;
  createdAt: string;
  lastModified: string;
  assets?: any[];
  camera?: any;
  shots?: any[];
  sceneSettings?: any;
}

const STORAGE_KEY = "kanto_projects";

const DEFAULT_PROJECTS: Project[] = [
  {
    id: "1",
    name: "Neon Genesis",
    title: "Neon Genesis",
    createdAt: "2026-08-10T12:00:00.000Z",
    lastModified: "2026-08-10T12:00:00.000Z",
  },
  {
    id: "2",
    name: "Void Walker",
    title: "Void Walker",
    createdAt: "2026-08-12T15:30:00.000Z",
    lastModified: "2026-08-12T15:30:00.000Z",
  },
  {
    id: "3",
    name: "Silhouette",
    title: "Silhouette",
    createdAt: "2026-08-14T09:00:00.000Z",
    lastModified: "2026-08-14T09:00:00.000Z",
  },
];

/**
 * Retrieve all projects from localStorage.
 */
export function getProjects(): Project[] {
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
 * Retrieve a specific project by its ID.
 */
export function getProject(id: string): Project | null {
  const projects = getProjects();
  return projects.find((p) => p.id === id) || null;
}

/**
 * Save or update a project in localStorage.
 */
export function saveProject(project: Partial<Project> & { id: string }): Project {
  if (typeof window === "undefined") {
    return {
      id: project.id,
      name: project.name || project.title || "Untitled Motion",
      title: project.title || project.name || "Untitled Motion",
      createdAt: project.createdAt || new Date().toISOString(),
      lastModified: new Date().toISOString(),
      ...project,
    };
  }

  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  const now = new Date().toISOString();

  let updated: Project;

  if (index >= 0) {
    const existing = projects[index]!;
    updated = {
      ...existing,
      ...project,
      name: project.name || project.title || existing.name,
      title: project.title || project.name || existing.title,
      lastModified: now,
    };
    projects[index] = updated;
  } else {
    updated = {
      id: project.id,
      name: project.name || project.title || "Untitled Motion",
      title: project.title || project.name || "Untitled Motion",
      createdAt: project.createdAt || now,
      lastModified: now,
      ...project,
    };
    projects.unshift(updated);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error("[projectStore] Failed to save project:", err);
  }

  return updated;
}

/**
 * Create a new project and store it in localStorage.
 */
export function createProject(name: string = "Untitled Motion"): Project {
  const id = Date.now().toString();
  const now = new Date().toISOString();
  const newProject: Project = {
    id,
    name,
    title: name,
    createdAt: now,
    lastModified: now,
  };

  const projects = getProjects();
  projects.unshift(newProject);

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
 * Delete a project by ID.
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
