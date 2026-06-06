import { html, nothing } from "lit";
import { SkytechPowerFlowCard } from "@/skytech-power-flow-card";
import { ConfigEntities, SkytechPowerFlowCardConfig } from "@/skytech-power-flow-card-config";
import { generalSecondarySpan } from "./spans/general-secondary-span";
import { displayValue } from "@/utils/display-value";
import { TemplatesObj } from "@/type";
import { getEntityStateWatts } from "@/states/utils/get-entity-state-watts";
import { isNumberValue } from "@/utils/utils";
import { computeSubSourceRows } from "@/utils/sub-source-breakdown";

export const solarElement = (
  main: SkytechPowerFlowCard,
  config: SkytechPowerFlowCardConfig,
  {
    entities,
    solar,
    templatesObj,
  }: {
    entities: ConfigEntities;
    solar: any;
    templatesObj: TemplatesObj;
  }
) => {
  const disableEntityClick = config.clickable_entities === false;
  const templateResult = templatesObj.solarSecondary;
  const shouldShowSecondary = () => {
    if (!!templateResult) return true;
    if (config.entities.solar?.secondary_info?.display_zero === true) return true;
    if (!solar?.secondary?.state) return false;
    if (!isNumberValue(solar?.secondary?.state)) return true;

    const toleranceSet = config.entities.solar?.secondary_info?.display_zero_tolerance ?? 0;
    return (
      Number(solar.secondary.state) >= toleranceSet ||
      (config.entities.solar?.secondary_info?.accept_negative && typeof Number(+solar.secondary.state) === "number")
    );
  };
  const sumTotalConfig = entities.solar?.secondary_info?.sum_total;
  const secondaryEntity = config.entities.solar?.secondary_info?.entity;
  const secondarySolarStateWatts = secondaryEntity ? Math.max(getEntityStateWatts(main.hass, secondaryEntity), 0) : 0;
  const bottomSolarState = sumTotalConfig ? solar.state.total - secondarySolarStateWatts : solar.state.total;
  const isExpandable = !!solar.expandable;
  const expandGroup = () => ({
    id: "solar",
    title: solar.name,
    kind: "solar" as const,
    rows: computeSubSourceRows(main.hass, "solar", solar.subSources, "mdi:solar-power"),
  });
  return html`<div class="circle-container solar">
    <span class="label">${solar.name}</span>
    <div
      class="circle ${disableEntityClick ? "pointer-events-none" : ""} ${isExpandable ? "expandable" : ""}"
      @click=${(e: MouseEvent) => {
        if (isExpandable) main.onGroupClick(e, expandGroup());
        else main.onEntityClick(e, solar, solar.entity);
      }}
      @dblclick=${(e: MouseEvent) => {
        main.onEntityDoubleClick(e, solar, solar.entity);
      }}
      @pointerdown=${(e: PointerEvent) => {
        main.onEntityPointerDown(e, solar, solar.entity);
      }}
      @pointerup=${(e: PointerEvent) => {
        main.onEntityPointerUp(e);
      }}
      @pointercancel=${(e: PointerEvent) => {
        main.onEntityPointerUp(e);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
        if (e.key === "Enter") {
          main.openDetails(e, solar, solar.entity, "tap");
        }
      }}
    >
      <ha-ripple .disabled=${disableEntityClick}></ha-ripple>
      ${shouldShowSecondary() ? generalSecondarySpan(main.hass, main, config, templatesObj, solar, "solar") : nothing}
      ${solar.icon !== " " ? html` <ha-icon id="solar-icon" .icon=${solar.icon}></ha-icon>` : nothing}
      ${isExpandable ? html`<ha-icon class="pfcp-group-badge" .icon=${"mdi:chevron-down"}></ha-icon>` : nothing}
      ${entities.solar?.display_zero_state !== false || (bottomSolarState || 0) > 0
        ? html` <span class="solar">
            ${displayValue(main.hass, config, bottomSolarState, {
              unit: solar.state.unit,
              unitWhiteSpace: solar.state.unit_white_space,
              decimals: solar.state.decimals,
              watt_threshold: config.watt_threshold,
            })}
          </span>`
        : nothing}
    </div>
  </div>`;
};
