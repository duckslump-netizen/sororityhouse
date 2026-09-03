import { defineTool } from "@lovable.dev/mcp-js";
import { characters, unlockLabel } from "@/lib/characters";

export default defineTool({
  name: "list_house",
  title: "List the house",
  description:
    "List every resident of the sorority house with her tag, blurb, and how her door unlocks.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const residents = characters.map((c) => ({
      id: c.id,
      name: c.name,
      tag: c.tag,
      line: c.line,
      unlock: unlockLabel(c.unlock),
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: residents
            .map((r) => `${r.name} — ${r.tag} (${r.unlock})\n${r.line}`)
            .join("\n\n"),
        },
      ],
      structuredContent: { residents },
    };
  },
});
