import { HomeAssistant } from "custom-card-helpers";
import { SkytechPowerFlowCardConfig } from "@/skytech-power-flow-card-config";
import { getFieldInState, getFieldOutState } from "./base";
import { getEntityState } from "@/states/utils/get-entity-state";
import { getEntityNames } from "@/states/utils/mutli-entity";

export const getBatteryStateOfCharge = (hass: HomeAssistant, config: SkytechPowerFlowCardConfig) => {
  const entity = config.entities.battery?.state_of_charge;

  if (entity === undefined) return null;

  // Several batteries: average the percentages instead of summing them.
  const ids = getEntityNames(entity);
  if (ids.length <= 1) return getEntityState(hass, entity);

  let sum = 0;
  let count = 0;
  for (const id of ids) {
    const soc = getEntityState(hass, id);
    if (soc !== null) {
      sum = sum + soc;
      count = count + 1;
    }
  }

  return count ? sum / count : null;
};

export const getBatteryInState = (hass: HomeAssistant, config: SkytechPowerFlowCardConfig) => getFieldInState(hass, config, "battery");

export const getBatteryOutState = (hass: HomeAssistant, config: SkytechPowerFlowCardConfig) => getFieldOutState(hass, config, "battery");
