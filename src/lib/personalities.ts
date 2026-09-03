/**
 * Personality system — the uploaded markdown files are the SOURCE OF TRUTH.
 *
 * Files live in src/content/personalities/ and are imported raw so the exact
 * text can be fed into the chat model prompt (per-girl chats and shared
 * house conversations).
 *
 * To add a new girl later: drop `<name>.md` in src/content/personalities/,
 * import it below, and reference it from her entry in characters.ts.
 */
import worldSetting from "@/content/personalities/world-setting.md?raw";
import sharedRules from "@/content/personalities/shared-rules.md?raw";
import relationshipProgression from "@/content/personalities/relationship-progression.md?raw";
import dakota from "@/content/personalities/dakota.md?raw";
import zoe from "@/content/personalities/zoe.md?raw";
import willow from "@/content/personalities/willow.md?raw";
import brittany from "@/content/personalities/brittany.md?raw";
import sasha from "@/content/personalities/sasha.md?raw";
import piper from "@/content/personalities/piper.md?raw";

/** Layers applied to every character, in every conversation. */
export const sharedLayers = {
  worldSetting,
  sharedRules,
  relationshipProgression,
} as const;

/** Per-character personality files, keyed by character id. */
export const personalityFiles: Record<string, string> = {
  dakota,
  zoe,
  willow,
  brittany,
  sasha,
  piper,
};

/** Full system prompt for a one-on-one chat with a single girl. */
export function buildCharacterPrompt(characterId: string): string {
  const file = personalityFiles[characterId];
  if (!file) throw new Error(`No personality file for character "${characterId}"`);
  return [
    sharedLayers.worldSetting,
    sharedLayers.sharedRules,
    sharedLayers.relationshipProgression,
    file,
  ].join("\n\n---\n\n");
}

/** System prompt for a shared conversation between several girls. */
export function buildSharedPrompt(characterIds: string[]): string {
  const files = characterIds.map((id) => {
    const file = personalityFiles[id];
    if (!file) throw new Error(`No personality file for character "${id}"`);
    return file;
  });
  return [
    sharedLayers.worldSetting,
    sharedLayers.sharedRules,
    sharedLayers.relationshipProgression,
    "# SHARED CONVERSATION\nThese girls are in the same conversation. Each speaks in her own voice, stays inside her own boundaries, and keeps her own trust level with the user. They react to each other as roommates who know each other well.",
    ...files,
  ].join("\n\n---\n\n");
}
