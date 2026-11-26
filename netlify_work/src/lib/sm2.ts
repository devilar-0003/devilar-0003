// Pure spaced-repetition logic (SM-2 lite). Shared between server and client.

export interface CardStateInput {
  ease: number;
  interval: number; // days
  reps: number;
  lapses: number;
}

export interface CardStateOutput extends CardStateInput {
  dueAt: Date;
}

export const RATING = { AGAIN: 0, HARD: 1, GOOD: 2, EASY: 3 } as const;
export type Rating = (typeof RATING)[keyof typeof RATING];

export function clampEase(ease: number): number {
  return Math.max(1.3, Math.min(3.0, ease));
}

export function computeNextState(
  input: CardStateInput,
  rating: Rating,
  now = new Date()
): CardStateOutput {
  let { ease, interval, reps, lapses } = input;

  if (rating === RATING.AGAIN) {
    lapses += 1;
    reps = 0;
    interval = 1;
    ease = clampEase(ease - 0.2);
  } else if (rating === RATING.HARD) {
    reps += 1;
    interval = interval <= 0 ? 1 : Math.max(1, Math.round(interval * 1.3));
    ease = clampEase(ease - 0.15);
  } else if (rating === RATING.GOOD) {
    reps += 1;
    interval = interval <= 0 ? 1 : Math.max(1, Math.round(interval * ease));
  } else {
    reps += 1;
    interval = interval <= 0 ? 2 : Math.max(2, Math.round(interval * ease * 1.35));
    ease = clampEase(ease + 0.15);
  }

  const dueAt = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  return { ease, interval, reps, lapses, dueAt };
}

/** Project the interval a rating WOULD produce today (for preview on buttons). */
export function projectInterval(input: CardStateInput, rating: Rating): number {
  return computeNextState(input, rating).interval;
}

export function formatInterval(days: number): string {
  if (days < 1) return "<1d";
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  return `${months}mo`;
}
