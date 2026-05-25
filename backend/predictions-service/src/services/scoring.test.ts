import { calculatePoints } from './calculatePoints';

function assertEqual(a: any, b: any, msg?: string) {
  if (a !== b) throw new Error(msg ?? `Assertion failed: ${a} !== ${b}`);
}

// exact match → 5 pts
assertEqual(calculatePoints(2, 1, 2, 1), 5, 'Exact match should be 5');

// correct outcome → 3 pts
assertEqual(calculatePoints(3, 1, 2, 0), 3, 'Correct outcome should be 3');

// wrong prediction → 0 pts
assertEqual(calculatePoints(0, 1, 2, 0), 0, 'No match should be 0');

console.log('scoring tests passed');
