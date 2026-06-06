import { HomeAssistant } from "custom-card-helpers";
import { SkytechPowerFlowCardConfig } from "@/skytech-power-flow-card-config";
import { getFieldInState, getFieldOutState, getSecondaryState } from "./base";

export const getGridConsumptionState = (hass: HomeAssistant, config: SkytechPowerFlowCardConfig) => getFieldOutState(hass, config, "grid");

export const getGridProductionState = (hass: HomeAssistant, config: SkytechPowerFlowCardConfig) => getFieldInState(hass, config, "grid");

export const getGridSecondaryState = (hass: HomeAssistant, config: SkytechPowerFlowCardConfig) => getSecondaryState(hass, config, "grid");
