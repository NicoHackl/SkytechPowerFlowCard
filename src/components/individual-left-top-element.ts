import { html, nothing, svg } from "lit";
import { individualSecondarySpan } from "./spans/individual-secondary-span";
import { NewDur, TemplatesObj } from "@/type";
import { SkytechPowerFlowCardConfig } from "@/skytech-power-flow-card-config";
import { computeIndividualFlowRate } from "@/utils/compute-flow-rate";
import { showLine } from "@/utils/show-line";
import { IndividualObject } from "@/states/raw/individual/get-individual-object";
import { SkytechPowerFlowCard } from "@/skytech-power-flow-card";
import { styleLine } from "@/utils/style-line";
import { checkShouldShowDots } from "@/utils/check-should-show-dots";
import { computeSubSourceRows } from "@/utils/sub-source-breakdown";

interface TopIndividual {
  newDur: NewDur;
  templatesObj: TemplatesObj;
  individualObj?: IndividualObject;
  displayState: string;
}

export const individualLeftTopElement = (
  main: SkytechPowerFlowCard,
  config: SkytechPowerFlowCardConfig,
  { individualObj, templatesObj, displayState, newDur }: TopIndividual
) => {
  if (!individualObj) return html`<div class="spacer"></div>`;
  const disableEntityClick = config.clickable_entities === false;
  const indexOfIndividual = config?.entities?.individual?.findIndex((e) => e.entity === individualObj.entity) || 0;
  const duration = newDur.individual[indexOfIndividual] || 0;
  const isExpandable = !!individualObj?.field?.entities?.length && individualObj?.field?.expandable !== false;
  const expandGroup = () => ({
    id: `individual:${individualObj.entity}`,
    title: individualObj.name,
    kind: "individual" as const,
    rows: computeSubSourceRows(main.hass, "individual", individualObj.field!.entities!, individualObj.icon),
  });
  return html`<div class="circle-container individual-top">
    <span class="label">${individualObj.name}</span>
    <div
      class="circle ${disableEntityClick ? "pointer-events-none" : ""} ${isExpandable ? "expandable" : ""}"
      @click=${(e: MouseEvent) => {
        if (isExpandable) main.onGroupClick(e, expandGroup());
        else main.onEntityClick(e, individualObj?.field, individualObj?.entity);
      }}
      @dblclick=${(e: MouseEvent) => {
        main.onEntityDoubleClick(e, individualObj?.field, individualObj?.entity);
      }}
      @pointerdown=${(e: PointerEvent) => {
        main.onEntityPointerDown(e, individualObj?.field, individualObj?.entity);
      }}
      @pointerup=${(e: PointerEvent) => {
        main.onEntityPointerUp(e);
      }}
      @pointercancel=${(e: PointerEvent) => {
        main.onEntityPointerUp(e);
      }}
      @keyDown=${(e: { key: string; stopPropagation: () => void; target: HTMLElement }) => {
        if (e.key === "Enter") {
          main.openDetails(e, individualObj?.field, individualObj?.entity, "tap");
        }
      }}
    >
      <ha-ripple .disabled=${disableEntityClick}></ha-ripple>
      ${individualSecondarySpan(main.hass, main, config, templatesObj, individualObj, indexOfIndividual, "left-top")}
      ${individualObj.icon !== " " ? html` <ha-icon id="individual-left-top-icon" .icon=${individualObj.icon}></ha-icon>` : nothing}
      ${isExpandable ? html`<ha-icon class="pfcp-group-badge" .icon=${"mdi:chevron-down"}></ha-icon>` : nothing}
      ${individualObj?.field?.display_zero_state !== false || (individualObj.state || 0) > (individualObj.displayZeroTolerance ?? 0)
        ? html` <span class="individual-top individual-left-top">
            ${individualObj?.showDirection
              ? html`<ha-icon class="small" .icon=${individualObj.invertAnimation ? "mdi:arrow-down" : "mdi:arrow-up"}></ha-icon>`
              : nothing}${displayState}
          </span>`
        : nothing}
    </div>
    ${showLine(config, individualObj.state || 0) && !config.entities.home?.hide
      ? html`
          <svg width="80" height="30">
            <path d="M40 -10 v50" id="individual-top" class="${styleLine(individualObj.state || 0, config)}" />
            ${checkShouldShowDots(config) && individualObj.state && individualObj.state >= (individualObj.displayZeroTolerance ?? 0)
              ? svg`<circle r="1.75" class="individual-top" vector-effect="non-scaling-stroke">
                    <animateMotion
                      dur="${computeIndividualFlowRate(individualObj?.field?.calculate_flow_rate, duration)}s"
                      repeatCount="indefinite"
                      calcMode="paced"
                      keyPoints="${individualObj.invertAnimation ? "0;1" : "1;0"}"
                      keyTimes="0;1"
                    >
                      <mpath xlink:href="#individual-top" />
                    </animateMotion>
                  </circle>`
              : nothing}
          </svg>
        `
      : nothing}
  </div>`;
};
