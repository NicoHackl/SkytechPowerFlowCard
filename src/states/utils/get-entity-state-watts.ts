import { HomeAssistant } from "custom-card-helpers";
import { getEntityState } from "./get-entity-state";
import { getEntityNames } from "./mutli-entity";

const prefixes = ["K", "M", "G", "T", "P", "E", "Z", "Y"];

export const getEntityStateWatts = (hass: HomeAssistant, entity: string | undefined): number => {
  if (!entity) return 0;

  // Multi-entity strings ("sensor.a | sensor.b") are summed up. Each entity is
  // converted to watts using its own unit, so sub-sources may mix W/kW.
  const ids = getEntityNames(entity);
  let total = 0;
  for (const id of ids) {
    const state = getEntityState(hass, id);
    if (state === null) continue;
    const unit = hass.states[id]?.attributes.unit_of_measurement ?? "";
    total = total + convertUnitToWatts(state, unit);
  }

  return total;
};

const convertUnitToWatts = (value: number, unit: string): number => {
  const prefix = unit.toUpperCase().slice(0, 1);
  const prefixIndex = prefixes.indexOf(prefix);

  if (prefixIndex > -1) return value * Math.pow(1000, prefixIndex + 1);
  return value;
};
