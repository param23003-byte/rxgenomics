import data from "@/lib/kb/kb.json";
import type { KnowledgeBase } from "./types";

/** The frozen CPIC knowledge base built by scripts/build-kb.mjs. */
export const kb = data as unknown as KnowledgeBase;

export const drugNames = Object.keys(kb.drugs).sort();
export const geneSymbols = Object.keys(kb.genes).sort();
