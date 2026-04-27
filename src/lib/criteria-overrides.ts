import { prisma } from "@/lib/db";
import { CRITERIA_CATEGORIES, type CriteriaCategory } from "@/lib/criteria";

/**
 * Returns merged criteria categories — defaults patched with any admin overrides.
 * Both `questions` and `maxPoints` are overridable; other fields stay canonical.
 */
export async function getMergedCriteria(): Promise<CriteriaCategory[]> {
  const overrides = await prisma.criteriaOverride.findMany();
  const overrideMap = new Map(
    overrides.map((o) => [o.categoryName, { questions: o.questions as string[], maxPoints: o.maxPoints }])
  );

  return CRITERIA_CATEGORIES.map((cat) => {
    const ov = overrideMap.get(cat.name);
    if (ov) {
      return {
        ...cat,
        questions: ov.questions,
        ...(ov.maxPoints != null ? { maxPoints: ov.maxPoints } : {}),
      };
    }
    return cat;
  });
}
