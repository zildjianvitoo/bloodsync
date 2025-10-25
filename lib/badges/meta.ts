export type BadgeKey = "FIRST_DROP" | "THREES_A_CHARM" | "ON_TIME";

export const BADGE_META: Record<BadgeKey, { label: string; description: string }> = {
  FIRST_DROP: {
    label: "First Drop",
    description: "Awarded for completing your first blood donation with BloodSync.",
  },
  THREES_A_CHARM: {
    label: "Three's a Charm",
    description: "Earned after three completed donations.",
  },
  ON_TIME: {
    label: "On-Time",
    description: "Granted for checking in within five minutes of your scheduled slot.",
  },
};
