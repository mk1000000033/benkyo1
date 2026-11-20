// 科目ごとの化合物いちらん
import type { CompoundFile } from "@/lib/compound-types";
import naturalProducts from "./natural-products.json";

export const COMPOUND_FILES: Record<string, CompoundFile> = {
  "natural-products": naturalProducts as CompoundFile,
};
