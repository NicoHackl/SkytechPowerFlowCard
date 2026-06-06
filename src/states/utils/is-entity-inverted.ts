import { SkytechPowerFlowCardConfig } from "@/skytech-power-flow-card-config";
import { EntityType } from "@/type";

export const isEntityInverted = (config: SkytechPowerFlowCardConfig, entityType: EntityType) => !!config.entities[entityType]?.invert_state;
