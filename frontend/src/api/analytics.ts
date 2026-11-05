import { api } from "./client";
import type { Extremes, GroupDimension, GroupStat, Overview } from "./types";

export const analytics = {
  overview: () => api<Overview>("/api/analytics/overview"),
  groups: (by: GroupDimension) => api<GroupStat[]>(`/api/analytics/groups?by=${by}`),
  extremes: () => api<Extremes>("/api/analytics/extremes"),
};
