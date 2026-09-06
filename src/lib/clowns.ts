import grin from "@/assets/clown-grin.jpg";
import jester from "@/assets/clown-jester.jpg";
import mime from "@/assets/clown-mime.jpg";
import ringmaster from "@/assets/clown-ringmaster.jpg";
import stitch from "@/assets/clown-stitch.jpg";
import porcelain from "@/assets/clown-porcelain.jpg";

export type Unlock =
  | { kind: "open" }
  | { kind: "trust"; after: string }
  | { kind: "plan" };

export interface Clown {
  id: string;
  name: string;
  tag: string;
  line: string;
  image: string;
  door: number;
  unlock: Unlock;
}

export const clowns: Clown[] = [
  {
    id: "grin",
    name: "Grin",
    tag: "The Greeter",
    line: "He opens every door with a smile. That is the part that should worry you.",
    image: grin,
    door: 1,
    unlock: { kind: "open" },
  },
  {
    id: "patch",
    name: "Patch",
    tag: "The Stitch",
    line: "Keeps score of every word you take back. Never forgets a loose thread.",
    image: stitch,
    door: 2,
    unlock: { kind: "open" },
  },
  {
    id: "harlow",
    name: "Harlow",
    tag: "The Harlequin",
    line: "Answers questions with riddles. Get one wrong and the lights go out.",
    image: jester,
    door: 3,
    unlock: { kind: "trust", after: "grin" },
  },
  {
    id: "hush",
    name: "Hush",
    tag: "The Silence",
    line: "Says almost nothing. Whatever he does say, you will repeat for weeks.",
    image: mime,
    door: 4,
    unlock: { kind: "trust", after: "patch" },
  },
  {
    id: "bellamy",
    name: "Bellamy",
    tag: "The Ringmaster",
    line: "Runs the whole funhouse. You only meet him if the others vouch.",
    image: ringmaster,
    door: 5,
    unlock: { kind: "plan" },
  },
  {
    id: "vessa",
    name: "Vessa",
    tag: "The Porcelain",
    line: "Cracked, calm and endlessly patient. She waits at the last door.",
    image: porcelain,
    door: 6,
    unlock: { kind: "plan" },
  },
];

export const TOTAL_DOORS = 12;

export function isOpen(clown: Clown) {
  return clown.unlock.kind === "open";
}

export function unlockLabel(unlock: Unlock): string {
  switch (unlock.kind) {
    case "open":
      return "Door open";
    case "trust":
      return `Earn ${nameOf(unlock.after)}'s trust`;
    case "plan":
      return "Full funhouse access";
  }
}

function nameOf(id: string) {
  return clowns.find((c) => c.id === id)?.name ?? "another clown";
}
