// TODO should be loaded from app in future
import "../resources/services/BlogResourceService";
import "../resources/services/MindmapResourceService";
import "../resources/services/ScrapbookResourceService";
import "../resources/services/CollaborativewallResourceService";
import "../resources/services/TimelineGeneratorResourceService.ts";

import { IOdeServices, OdeServices } from "./OdeServices";

export const odeServices: IOdeServices = new OdeServices();

export * from "./SnipletsService";
export * from "../directory/interface";
export * from "../resources/interface";
export type { ILinkedResource } from "../resources/behaviours/AbstractBehaviourService"; // FIXME to be removed when dropping behaviours
export * from "../rights/interface";
export * from "../share/interface";
export * from "../workspace/interface";
