import { HomeAssistant } from "custom-card-helpers";
import { SubSource } from "@/type";
import { getEntityStateWatts } from "@/states/utils/get-entity-state-watts";
import { getEntityState } from "@/states/utils/get-entity-state";

export type BreakdownRow = {
  name: string;
  icon: string;
  color: string | null;
  /** Current power in watts (already direction-corrected). */
  state: number;
  /** The (first) entity id, used for the more-info dialog when a row is tapped. */
  entity: string;
  unit?: string;
  /** State of charge in percent, only for battery sub-sources. */
  soc?: number | null;
};

const subEntityId = (sub: SubSource): string => {
  const e = sub.entity;
  if (typeof e === "string") return e;
  return e?.consumption || e?.production || "";
};

const colorToString = (color: SubSource["color"]): string | null => {
  if (!color) return null;
  if (typeof color === "string") return color;
  return color.consumption || color.production || null;
};

/**
 * Builds the list of rows shown in the expandable popup for a group of
 * sub-sources (solar strings, individual batteries or grouped consumers).
 */
export const computeSubSourceRows = (
  hass: HomeAssistant,
  kind: "solar" | "battery" | "individual",
  subs: SubSource[],
  defaultIcon: string
): BreakdownRow[] =>
  subs.map((sub) => {
    const id = subEntityId(sub);
    let state = 0;

    if (typeof sub.entity === "object") {
      const prod = sub.entity.production ? getEntityStateWatts(hass, sub.entity.production) : 0;
      const cons = sub.entity.consumption ? getEntityStateWatts(hass, sub.entity.consumption) : 0;
      // Positive => charging (production into battery), negative => discharging.
      state = prod - cons;
    } else {
      state = getEntityStateWatts(hass, id);
      if (sub.invert_state) state = -state;
      if (kind === "individual") state = Math.abs(state);
    }

    return {
      name: sub.name || hass.states[id]?.attributes?.friendly_name || id,
      icon: sub.icon || defaultIcon,
      color: colorToString(sub.color),
      state,
      entity: id,
      unit: sub.unit_of_measurement,
      soc: sub.state_of_charge ? getEntityState(hass, sub.state_of_charge) : null,
    };
  });
