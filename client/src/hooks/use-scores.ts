import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type ScoreInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useSubmitScore() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ScoreInput) => {
      const validated = api.scores.submit.input.parse(data);
      const res = await fetch(api.scores.submit.path, {
        method: api.scores.submit.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        if (res.status === 400) {
          const error = api.scores.submit.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to submit score");
      }
      return api.scores.submit.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.scores.listMyScores.path] });
      toast({
        title: "Score Submitted!",
        description: "Your progress has been saved.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useMyScores() {
  return useQuery({
    queryKey: [api.scores.listMyScores.path],
    queryFn: async () => {
      const res = await fetch(api.scores.listMyScores.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch scores");
      return api.scores.listMyScores.responses[200].parse(await res.json());
    },
  });
}

export function useLeaderboard(levelId: number) {
  return useQuery({
    queryKey: [api.scores.getLeaderboard.path, levelId],
    queryFn: async () => {
      const url = buildUrl(api.scores.getLeaderboard.path, { levelId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return api.scores.getLeaderboard.responses[200].parse(await res.json());
    },
    enabled: !!levelId,
  });
}
