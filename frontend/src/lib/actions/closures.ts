/** Admin actions for closures: typed callers of backend/src/actions/closures.ts through /api/admin/rpc. */
import { rpc } from "../rpc";
import type { ClosureActionState, CustomClosureActionState, ServiceClosure } from "../action-types";
import type { ServiceKey } from "../content-types";

export type { ClosureActionState, CustomClosureActionState, ServiceClosure };

export const listServiceClosures = () => rpc<ServiceClosure[]>("closures.listServiceClosures", []);
export const setServiceClosureActive = (serviceKey: ServiceKey, isActive: boolean) => rpc<void>("closures.setServiceClosureActive", [serviceKey, isActive]);
export const updateServiceClosureMessage = (serviceKey: ServiceKey, input: unknown) => rpc<ClosureActionState>("closures.updateServiceClosureMessage", [serviceKey, input]);
export const createClosure = (input: unknown) => rpc<CustomClosureActionState>("closures.createClosure", [input]);
export const updateClosure = (id: number, input: unknown) => rpc<CustomClosureActionState>("closures.updateClosure", [id, input]);
export const setClosureActive = (id: number, isActive: boolean) => rpc<void>("closures.setClosureActive", [id, isActive]);
export const deleteClosure = (id: number) => rpc<void>("closures.deleteClosure", [id]);
