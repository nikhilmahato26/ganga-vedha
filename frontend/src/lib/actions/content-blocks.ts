/** Admin actions for content-blocks: typed callers of backend/src/actions/content-blocks.ts through /api/admin/rpc. */
import { rpc } from "../rpc";
import type { ContentBlockActionState } from "../action-types";

export type { ContentBlockActionState };

export const updateWhyUsBlock = (input: unknown) => rpc<ContentBlockActionState>("contentBlocks.updateWhyUsBlock", [input]);
export const updateHeroRoomsBlock = (input: unknown) => rpc<ContentBlockActionState>("contentBlocks.updateHeroRoomsBlock", [input]);
