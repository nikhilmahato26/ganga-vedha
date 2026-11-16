/** Admin actions for settings: typed callers of backend/src/actions/settings.ts through /api/admin/rpc. */
import { rpc } from "../rpc";
import type { SettingsActionState } from "../action-types";

export type { SettingsActionState };

export const updateSettings = (input: unknown) => rpc<SettingsActionState>("settings.updateSettings", [input]);
