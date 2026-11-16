/** Admin actions for packages: typed callers of backend/src/actions/packages.ts through /api/admin/rpc. */
import { rpc } from "../rpc";
import type { PackageActionState } from "../action-types";

export type { PackageActionState };

export const createPackage = (input: unknown) => rpc<PackageActionState>("packages.createPackage", [input]);
export const updatePackage = (id: number, input: unknown) => rpc<PackageActionState>("packages.updatePackage", [id, input]);
export const deletePackage = (id: number) => rpc<void>("packages.deletePackage", [id]);
export const setPackagePublished = (id: number, isPublished: boolean) => rpc<void>("packages.setPackagePublished", [id, isPublished]);
export const movePackage = (id: number, direction: "up" | "down") => rpc<void>("packages.movePackage", [id, direction]);
