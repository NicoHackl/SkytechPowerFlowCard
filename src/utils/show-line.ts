import { SkytechPowerFlowCardConfig } from "@/skytech-power-flow-card-config";

export const showLine = (config: SkytechPowerFlowCardConfig, power: number): boolean => {
  if (power > 0) return true;
  return config?.display_zero_lines?.mode !== "hide";
};
