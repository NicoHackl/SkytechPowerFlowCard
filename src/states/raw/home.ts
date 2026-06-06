import { HomeAssistant } from "custom-card-helpers";
import { getSecondaryState } from "./base";
import { SkytechPowerFlowCardConfig } from "@/skytech-power-flow-card-config";

export const getHomeSecondaryState = (hass: HomeAssistant, config: SkytechPowerFlowCardConfig) => getSecondaryState(hass, config, "home");
