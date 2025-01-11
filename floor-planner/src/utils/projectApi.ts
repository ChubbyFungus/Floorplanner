import { ProjectData } from "../types";

export async function getProjectsFromServer(): Promise<ProjectData[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "proj-1",
          name: "Kitchen Remodel",
          description: "Kitchen floor plan with island and cabinets.",
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        {
          id: "proj-2",
          name: "Bathroom Renovation",
          description: "Standalone tub, new vanity, advanced materials.",
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      ]);
    }, 1000);
  });
}
