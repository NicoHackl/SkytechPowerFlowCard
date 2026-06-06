import { mdiClose, mdiDrag, mdiPencil } from "@mdi/js";
import { HomeAssistant } from "custom-card-helpers";
import { css, CSSResultGroup, html, LitElement, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import type { SortableEvent } from "sortablejs";
import { SubSource } from "@/type";
import { fireEvent } from "@/ui-editor/utils/fire-event";
import { sortableStyles } from "@/ui-editor/utils/sortable-styles";
import { loadSortable, SortableInstance } from "@/ui-editor/utils/sortable.ondemand";
import { loadHaForm } from "@/ui-editor/utils/load-ha-form";
import { subSourceSchema } from "@/ui-editor/schema/sub-source";
import localize from "@/localize/localize";

declare global {
  interface HASSDomEvents {
    "sub-entities-changed": {
      entities: SubSource[];
    };
  }
}

/**
 * Reusable editor for the `entities` (sub-sources) array of an aggregated field
 * (solar, battery or an individual consumer group). Renders a sortable list of
 * entity rows with per-row detail editing, mirroring the individual devices UI.
 */
@customElement("sub-source-editor")
export class SubSourceEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @property({ attribute: false }) public subSources: SubSource[] = [];

  @property() public kind: "solar" | "battery" | "individual" = "individual";

  @state() private _indexBeingEdited = -1;

  private _keys = new WeakMap<SubSource, string>();

  private _sortable?: SortableInstance;

  public connectedCallback(): void {
    super.connectedCallback();
    void loadHaForm();
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._destroySortable();
  }

  protected firstUpdated(): void {
    this._createSortable();
  }

  private _getKey(sub: SubSource): string {
    if (!this._keys.has(sub)) {
      this._keys.set(sub, Math.random().toString());
    }
    return this._keys.get(sub)!;
  }

  private _entityLabel(sub: SubSource): string {
    if (typeof sub.entity === "string") return sub.entity;
    return sub.entity?.consumption || sub.entity?.production || "";
  }

  protected render() {
    if (!this.hass) return nothing;

    if (this._indexBeingEdited !== -1 && this.subSources[this._indexBeingEdited]) {
      const sub = this.subSources[this._indexBeingEdited];
      const isSplit = typeof sub.entity === "object";
      return html`
        <div class="sub-header">
          <h4>${this._indexBeingEdited + 1} / ${this.subSources.length} ${localize(`editor.${this.kind}`)}</h4>
          <ha-icon-button .path=${mdiClose} class="remove-icon" @click=${() => (this._indexBeingEdited = -1)}></ha-icon-button>
        </div>
        ${isSplit ? html`<p class="hint">${localize("editor.split_sub_source_hint") || "Split entities can only be edited in YAML."}</p>` : nothing}
        <ha-form
          .hass=${this.hass}
          .data=${sub}
          .schema=${subSourceSchema(this.kind)}
          .computeLabel=${this._computeLabelCallback}
          @value-changed=${this._detailChanged}
        ></ha-form>
      `;
    }

    return html`
      <div class="entities">
        ${repeat(
          this.subSources,
          (sub) => this._getKey(sub),
          (sub, index) => html`
            <div class="entity">
              <div class="handle">
                <ha-svg-icon .path=${mdiDrag}></ha-svg-icon>
              </div>
              ${typeof sub.entity === "object"
                ? html`<div class="special-row">
                    <div>
                      <span>${sub.name || this._entityLabel(sub)}</span>
                      <span class="secondary">${localize("editor.split_sub_source_hint") || "Split entity (edit in YAML)"}</span>
                    </div>
                  </div>`
                : html`
                    <ha-entity-picker
                      allow-custom-entity
                      hideClearIcon
                      .hass=${this.hass}
                      .value=${sub.entity}
                      .index=${index}
                      @value-changed=${this._entityChanged}
                    ></ha-entity-picker>
                  `}
              <ha-icon-button .path=${mdiClose} class="remove-icon" .index=${index} @click=${this._removeRow}></ha-icon-button>
              <ha-icon-button .path=${mdiPencil} class="edit-icon" .index=${index} @click=${() => (this._indexBeingEdited = index)}></ha-icon-button>
            </div>
          `
        )}
      </div>
      <ha-entity-picker class="add-entity" .hass=${this.hass} @value-changed=${this._addEntity}></ha-entity-picker>
    `;
  }

  private _computeLabelCallback = (schema: any) =>
    this.hass!.localize(`ui.panel.lovelace.editor.card.generic.${schema?.name}`) || localize(`editor.${schema?.name}`) || schema?.label;

  private async _createSortable(): Promise<void> {
    const container = this.shadowRoot?.querySelector<HTMLElement>(".entities");
    if (!container) return;
    const Sortable = await loadSortable();
    this._sortable = new Sortable(container, {
      animation: 150,
      fallbackClass: "sortable-fallback",
      handle: ".handle",
      onChoose: (evt: SortableEvent) => {
        (evt.item as any).placeholder = document.createComment("sort-placeholder");
        evt.item.after((evt.item as any).placeholder);
      },
      onEnd: (evt: SortableEvent) => {
        if ((evt.item as any).placeholder) {
          (evt.item as any).placeholder.replaceWith(evt.item);
          delete (evt.item as any).placeholder;
        }
        if (evt.oldIndex === evt.newIndex) return;
        const next = this.subSources.concat();
        next.splice(evt.newIndex!, 0, next.splice(evt.oldIndex!, 1)[0]);
        this._emit(next);
      },
    });
  }

  private _destroySortable(): void {
    this._sortable?.destroy();
    this._sortable = undefined;
  }

  private _emit(entities: SubSource[]): void {
    fireEvent(this, "sub-entities-changed", { entities });
  }

  private _addEntity(ev: CustomEvent): void {
    const value = ev.detail.value;
    if (!value) return;
    (ev.target as any).value = "";
    this._emit(this.subSources.concat({ entity: value as string }));
  }

  private _removeRow(ev: CustomEvent): void {
    const index = (ev.currentTarget as any).index;
    const next = this.subSources.concat();
    next.splice(index, 1);
    this._emit(next);
  }

  private _entityChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    const value = ev.detail.value;
    const index = (ev.target as any).index;
    const next = this.subSources.concat();
    if (!value) {
      next.splice(index, 1);
    } else {
      next[index] = { ...next[index], entity: value };
    }
    this._emit(next);
  }

  private _detailChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    const updated = ev.detail.value as SubSource;
    if (this._indexBeingEdited === -1) return;
    const next = this.subSources.concat();
    next[this._indexBeingEdited] = updated;
    this._emit(next);
  }

  static get styles(): CSSResultGroup {
    return [
      sortableStyles,
      css`
        ha-entity-picker {
          margin-top: 8px;
        }
        .sub-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-inline: 0.2rem;
          margin-bottom: 1rem;
        }
        .hint {
          color: var(--secondary-text-color);
          font-size: 12px;
          margin: 0 0 8px 0;
        }
        .add-entity {
          display: block;
          margin-left: 31px;
          margin-right: 71px;
          margin-inline-start: 31px;
          margin-inline-end: 71px;
          direction: var(--direction);
        }
        .entity {
          display: flex;
          align-items: center;
        }
        .entity .handle {
          padding-right: 8px;
          cursor: move;
          padding-inline-end: 8px;
          padding-inline-start: initial;
          direction: var(--direction);
        }
        .entity .handle > * {
          pointer-events: none;
        }
        .entity ha-entity-picker {
          flex-grow: 1;
          min-width: 0px;
        }
        .special-row {
          height: 60px;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-grow: 1;
        }
        .special-row div {
          display: flex;
          flex-direction: column;
        }
        .remove-icon,
        .edit-icon {
          --mdc-icon-button-size: 36px;
          color: var(--secondary-text-color);
        }
        .secondary {
          font-size: 12px;
          color: var(--secondary-text-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sub-source-editor": SubSourceEditor;
  }
}
