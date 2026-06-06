import { SkytechPowerFlowCardConfig } from "@/skytech-power-flow-card-config";

export const checkShouldShowDots = (config: SkytechPowerFlowCardConfig) => {
  if (config.disable_dots === true) {
    return false;
  }
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return false;
  }
  return true;
};
