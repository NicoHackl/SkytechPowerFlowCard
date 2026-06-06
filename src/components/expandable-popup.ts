import { html, nothing } from "lit";
import { PowerFlowCardPlus } from "@/power-flow-card-plus";
import { PowerFlowCardPlusConfig } from "@/power-flow-card-plus-config";
import { displayValue } from "@/utils/display-value";
import { BreakdownRow } from "@/utils/sub-source-breakdown";

export type ExpandedGroup = {
  /** Stable identifier so re-clicking the same circle toggles the popup. */
  id: string;
  title: string;
  kind: "solar" | "battery" | "individual";
  rows: BreakdownRow[];
};

/**
 * A small modal overlay listing the individual sub-sources of an aggregated
 * field (solar, battery or a grouped consumer). Tapping a row opens the
 * more-info dialog for that entity.
 */
export const expandablePopup = (main: PowerFlowCardPlus, config: PowerFlowCardPlusConfig, group: ExpandedGroup) => html`
  <div class="pfcp-popup-backdrop" @click=${() => main.closeExpand()}>
    <div class="pfcp-popup" @click=${(e: MouseEvent) => e.stopPropagation()}>
      <div class="pfcp-popup-header">
        <span class="pfcp-popup-title">${group.title}</span>
        <ha-icon class="pfcp-popup-close" .icon=${"mdi:close"} @click=${() => main.closeExpand()}></ha-icon>
      </div>
      <div class="pfcp-popup-body">
        ${group.rows.map(
          (row: BreakdownRow) => html`
            <div
              class="pfcp-popup-row"
              @click=${(e: MouseEvent) => {
                e.stopPropagation();
                main.openMoreInfoForEntity(row.entity);
              }}
            >
              <ha-icon class="pfcp-popup-row-icon" style=${row.color ? `color:${row.color}` : ""} .icon=${row.icon}></ha-icon>
              <span class="pfcp-popup-row-name">${row.name}</span>
              <span class="pfcp-popup-row-state">
                ${displayValue(main.hass, config, row.state, {
                  unit: row.unit,
                  accept_negative: true,
                  watt_threshold: config.watt_threshold,
                })}${row.soc !== null && row.soc !== undefined
                  ? html`<span class="pfcp-popup-row-soc">
                      ${displayValue(main.hass, config, row.soc, { unit: "%", accept_negative: true, watt_threshold: config.watt_threshold })}
                    </span>`
                  : nothing}
              </span>
            </div>
          `
        )}
      </div>
    </div>
  </div>
`;
