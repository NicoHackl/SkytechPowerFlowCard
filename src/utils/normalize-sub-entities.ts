import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { SubSource } from "@/type";

/**
 * Joins the entity ids of a list of sub-sources into a single pipe-delimited
 * string (e.g. "sensor.a | sensor.b"). The card already supports summing such
 * multi-entity strings throughout its state readers, so this lets aggregated
 * solar/battery/individual fields reuse the entire existing power-flow math.
 */
const joinEntities = (subs: SubSource[], pick?: "consumption" | "production"): string =>
  subs
    .map((s) => {
      const e = s.entity;
      if (typeof e === "string") return e;
      return pick ? e?.[pick] : e?.consumption || e?.production;
    })
    .filter((e): e is string => typeof e === "string" && e.length > 0)
    .join(" | ");

const anySplit = (subs: SubSource[]): boolean => subs.some((s) => typeof s.entity === "object");

/**
 * Normalizes a config that uses the `entities` arrays on solar, battery or
 * individual devices into the single-entity shape the rest of the card expects.
 * The original `entities` arrays are kept untouched so the expandable popup can
 * still list every sub-source individually.
 */
export const normalizeSubEntities = (config: PowerFlowCardPlusConfig): PowerFlowCardPlusConfig => {
  if (!config?.entities) return config;
  const entities = { ...config.entities };

  // --- Solar -------------------------------------------------------------
  if (entities.solar?.entities?.length) {
    const subs = entities.solar.entities;
    entities.solar = { ...entities.solar };
    if (!entities.solar.entity) {
      entities.solar.entity = joinEntities(subs);
    }
  }

  // --- Battery -----------------------------------------------------------
  if (entities.battery?.entities?.length) {
    const subs = entities.battery.entities;
    entities.battery = { ...entities.battery };
    if (!entities.battery.entity) {
      entities.battery.entity = anySplit(subs)
        ? { consumption: joinEntities(subs, "consumption"), production: joinEntities(subs, "production") }
        : joinEntities(subs);
    }
    if (!entities.battery.state_of_charge) {
      const socs = subs.map((s) => s.state_of_charge).filter((s): s is string => typeof s === "string" && s.length > 0);
      if (socs.length) entities.battery.state_of_charge = socs.join(" | ");
    }
  }

  // --- Individual consumer groups ---------------------------------------
  if (entities.individual?.length) {
    entities.individual = entities.individual.map((ind) =>
      ind?.entities?.length && !ind.entity ? { ...ind, entity: joinEntities(ind.entities) } : ind
    );
  }

  return { ...config, entities };
};
