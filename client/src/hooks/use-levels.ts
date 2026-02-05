import { useQuery } from "@tanstack/react-query";
import { api, buildUrl, type LevelsListResponse } from "@shared/routes";

export function useLevels() {
  return useQuery({
    queryKey: [api.levels.list.path],
    queryFn: async () => {
      const res = await fetch(api.levels.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch levels");
      return api.levels.list.responses[200].parse(await res.json());
    },
  });
}

export function useLevel(id: number) {
  return useQuery({
    queryKey: [api.levels.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.levels.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch level");
      return api.levels.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !isNaN(id),
  });
}
