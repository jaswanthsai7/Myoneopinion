import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api-client";
import type { Opinion } from "@/lib/spot-types";

export function useOpinions(sort: "top" | "new") {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setOpinions(await api.listOpinions(sort));
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load opinions.");
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { opinions, loading, error, reload };
}
