import { useSyncExternalStore } from "react";
import {
  subscribeContributions,
  getContributionsVersion,
} from "../data/mockWorkspace";

export function useContributionsSync(): number {
  return useSyncExternalStore(
    subscribeContributions,
    getContributionsVersion,
    getContributionsVersion
  );
}
