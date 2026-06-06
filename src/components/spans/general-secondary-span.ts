import { nothing } from "lit";
import { baseSecondarySpan } from "./base-secondary-span";
import { HomeAssistant } from "custom-card-helpers";
import { displayValue } from "@/utils/display-value";
import { SkytechPowerFlowCard } from "@/skytech-power-flow-card";
import { ActionConfigSet, TemplatesObj } from "@/type";
import { SkytechPowerFlowCardConfig } from "@/skytech-power-flow-card-config";

export const generalSecondarySpan = (
  hass: HomeAssistant,
  main: SkytechPowerFlowCard,
  config: SkytechPowerFlowCardConfig,
  templatesObj: TemplatesObj,
  field: {
    secondary: {
      has: any;
      template: any;
      entity: any;
      icon: any;
      state: string | number | null;
      unit: string | undefined;
      unit_white_space: boolean | undefined;
      decimals: number | undefined;
      accept_negative: boolean | undefined;
      tap_action?: ActionConfigSet["tap_action"];
      hold_action?: ActionConfigSet["hold_action"];
      double_tap_action?: ActionConfigSet["double_tap_action"];
    };
  },
  key: string
) => {
  if (!field?.secondary?.has && !field?.secondary?.template) return nothing;

  return baseSecondarySpan({
    main,
    className: key,
    entityId: field.secondary.entity,
    icon: field.secondary.icon,
    value: displayValue(hass, config, field.secondary.state, {
      unit: field.secondary.unit,
      unitWhiteSpace: field.secondary.unit_white_space,
      decimals: field.secondary.decimals,
      accept_negative: field.secondary.accept_negative,
      watt_threshold: config.watt_threshold,
    }),
    actions: {
      tap_action: field.secondary.tap_action,
      hold_action: field.secondary.hold_action,
      double_tap_action: field.secondary.double_tap_action,
    },
    template: templatesObj[`${key}Secondary`],
  });
};
