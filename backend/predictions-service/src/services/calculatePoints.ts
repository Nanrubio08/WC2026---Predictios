export function calculatePoints(
  homeActual: number,
  awayActual: number,
  homePredicted: number,
  awayPredicted: number
): number {
  if (homePredicted === homeActual && awayPredicted === awayActual) {
    return 5;
  }

  const actualOutcome = Math.sign(homeActual - awayActual);
  const predictedOutcome = Math.sign(homePredicted - awayPredicted);

  if (actualOutcome === predictedOutcome) {
    return 3;
  }

  return 0;
}
