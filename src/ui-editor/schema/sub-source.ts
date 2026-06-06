import localize from "@/localize/localize";

/**
 * Per-row form schema for a single sub-source of an aggregated field.
 * `state_of_charge` is only relevant for battery sub-sources.
 */
export const subSourceSchema = (kind: "solar" | "battery" | "individual") =>
  [
    {
      name: "entity",
      selector: { entity: {} },
    },
    {
      name: "name",
      label: "Name",
      selector: { text: {} },
    },
    {
      name: "icon",
      label: "Icon",
      selector: { icon: {} },
    },
    {
      name: "color",
      label: localize("editor.color") || "Color",
      selector: { color_rgb: {} },
    },
    ...(kind === "battery"
      ? [
          {
            name: "state_of_charge",
            label: localize("editor.state_of_charge") || "State of Charge",
            selector: { entity: {} },
          },
        ]
      : []),
    {
      name: "unit_of_measurement",
      label: localize("editor.unit_of_measurement") || "Unit",
      selector: { text: {} },
    },
    {
      name: "invert_state",
      label: localize("editor.invert_state") || "Invert State",
      selector: { boolean: {} },
    },
  ] as const;
