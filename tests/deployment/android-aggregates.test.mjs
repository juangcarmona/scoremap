import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateFromArguments, aggregates, gradleInvocation } from '../../src/android/scripts/verify-android.mjs';

test('the root adapter selects exactly one declared aggregate', () => {
  assert.deepEqual(aggregates, ['verifyHost', 'verifyDevice', 'verifyRelease']);
  assert.equal(aggregateFromArguments([]), 'verifyHost');
  assert.equal(aggregateFromArguments(['device']), 'verifyDevice');
  assert.equal(aggregateFromArguments(['release']), 'verifyRelease');
  assert.throws(() => aggregateFromArguments(['verifyHost']), /Expected no argument/);
  assert.throws(() => aggregateFromArguments(['host', 'device']), /Expected no argument/);
});

test('every invocation form runs the selected aggregate and nothing else', () => {
  for (const useHelper of [true, false]) {
    for (const aggregate of aggregates) {
      const { args } = gradleInvocation(useHelper, '/tmp/cache', aggregate);
      assert.equal(args.at(-1), aggregate);
      assert.equal(args.filter(arg => aggregates.includes(arg)).length, 1);
    }
  }
  assert.throws(() => gradleInvocation(false, '/tmp/cache', 'assemble'), /Unknown Android aggregate/);
});
