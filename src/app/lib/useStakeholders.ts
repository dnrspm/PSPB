import { useSyncExternalStore } from "react";
import {
  subscribeStakeholders,
  getStakeholders,
} from "../data/mockStakeholders";
import type { Stakeholder } from "../types/stakeholder";

export function useStakeholders(): Stakeholder[] {
  return useSyncExternalStore(
    subscribeStakeholders,
    getStakeholders,
    getStakeholders
  );
}
