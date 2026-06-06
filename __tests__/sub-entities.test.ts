import { describe, expect, test } from "@jest/globals";
import type { HomeAssistant } from "custom-card-helpers";

import { normalizeSubEntities } from "../src/utils/normalize-sub-entities";
import { computeSubSourceRows } from "../src/utils/sub-source-breakdown";
import { getEntityStateWatts } from "../src/states/utils/get-entity-state-watts";
import { getBatteryStateOfCharge } from "../src/states/raw/battery";
import type { PowerFlowCardPlusConfig } from "../src/power-flow-card-plus-config";

const makeHass = (states: Record<string, { state: string; unit?: string; friendly_name?: string }>): HomeAssistant =>
  ({
    states: Object.fromEntries(
      Object.entries(states).map(([id, s]) => [id, { state: s.state, attributes: { unit_of_measurement: s.unit, friendly_name: s.friendly_name } }])
    ),
  }) as unknown as HomeAssistant;

describe("normalizeSubEntities", () => {
  test("joins multiple solar sub-sources into a single pipe entity", () => {
    const config = {
      entities: { solar: { entities: [{ entity: "sensor.solar_east" }, { entity: "sensor.solar_west" }] } },
    } as unknown as PowerFlowCardPlusConfig;

    const result = normalizeSubEntities(config);
    expect(result.entities.solar?.entity).toBe("sensor.solar_east | sensor.solar_west");
    // original array kept for the popup
    expect(result.entities.solar?.entities?.length).toBe(2);
  });

  test("joins battery sub-sources and their state_of_charge sensors", () => {
    const config = {
      entities: {
        battery: {
          entities: [
            { entity: "sensor.bat1", state_of_charge: "sensor.soc1" },
            { entity: "sensor.bat2", state_of_charge: "sensor.soc2" },
          ],
        },
      },
    } as unknown as PowerFlowCardPlusConfig;

    const result = normalizeSubEntities(config);
    expect(result.entities.battery?.entity).toBe("sensor.bat1 | sensor.bat2");
    expect(result.entities.battery?.state_of_charge).toBe("sensor.soc1 | sensor.soc2");
  });

  test("builds split combo entity when a battery sub-source uses split entities", () => {
    const config = {
      entities: {
        battery: {
          entities: [
            { entity: { consumption: "sensor.b1_out", production: "sensor.b1_in" } },
            { entity: { consumption: "sensor.b2_out", production: "sensor.b2_in" } },
          ],
        },
      },
    } as unknown as PowerFlowCardPlusConfig;

    const result = normalizeSubEntities(config);
    expect(result.entities.battery?.entity).toEqual({
      consumption: "sensor.b1_out | sensor.b2_out",
      production: "sensor.b1_in | sensor.b2_in",
    });
  });

  test("joins individual sub-devices (consumer group)", () => {
    const config = {
      entities: {
        individual: [{ name: "Wallbox", entities: [{ entity: "sensor.wb1" }, { entity: "sensor.wb2" }] }],
      },
    } as unknown as PowerFlowCardPlusConfig;

    const result = normalizeSubEntities(config);
    expect(result.entities.individual?.[0].entity).toBe("sensor.wb1 | sensor.wb2");
  });

  test("does not override an explicitly configured entity", () => {
    const config = {
      entities: { solar: { entity: "sensor.explicit", entities: [{ entity: "sensor.a" }] } },
    } as unknown as PowerFlowCardPlusConfig;

    expect(normalizeSubEntities(config).entities.solar?.entity).toBe("sensor.explicit");
  });
});

describe("getEntityStateWatts with multiple entities", () => {
  test("sums sub-sources converting each by its own unit", () => {
    const hass = makeHass({
      "sensor.a": { state: "1", unit: "kW" }, // 1000 W
      "sensor.b": { state: "500", unit: "W" }, // 500 W
    });
    expect(getEntityStateWatts(hass, "sensor.a | sensor.b")).toBe(1500);
  });
});

describe("getBatteryStateOfCharge with multiple batteries", () => {
  test("averages the percentages instead of summing", () => {
    const hass = makeHass({
      "sensor.soc1": { state: "80", unit: "%" },
      "sensor.soc2": { state: "60", unit: "%" },
    });
    const config = { entities: { battery: { state_of_charge: "sensor.soc1 | sensor.soc2" } } } as unknown as PowerFlowCardPlusConfig;
    expect(getBatteryStateOfCharge(hass, config)).toBe(70);
  });
});

describe("computeSubSourceRows", () => {
  test("builds rows for solar sources using friendly names and watts", () => {
    const hass = makeHass({
      "sensor.solar_east": { state: "1.5", unit: "kW", friendly_name: "East" },
      "sensor.solar_west": { state: "800", unit: "W", friendly_name: "West" },
    });
    const rows = computeSubSourceRows(hass, "solar", [{ entity: "sensor.solar_east" }, { entity: "sensor.solar_west" }], "mdi:solar-power");
    expect(rows.map((r) => r.name)).toEqual(["East", "West"]);
    expect(rows.map((r) => r.state)).toEqual([1500, 800]);
    expect(rows.every((r) => r.icon === "mdi:solar-power")).toBe(true);
  });

  test("battery split sub-source shows net power and state of charge", () => {
    const hass = makeHass({
      "sensor.bat_in": { state: "300", unit: "W" },
      "sensor.bat_out": { state: "0", unit: "W" },
      "sensor.soc": { state: "55", unit: "%" },
    });
    const rows = computeSubSourceRows(
      hass,
      "battery",
      [{ entity: { consumption: "sensor.bat_out", production: "sensor.bat_in" }, state_of_charge: "sensor.soc", name: "Battery 1" }],
      "mdi:battery-high"
    );
    expect(rows[0].state).toBe(300);
    expect(rows[0].soc).toBe(55);
  });
});
