import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const knowledge = JSON.parse(await readFile(new URL('../knowledge.json', import.meta.url), 'utf8'));

test('preliminary prices distinguish general custom catios from new-roof projects', () => {
  assert.equal(knowledge.startingPricesUSD.custom, 8000);
  assert.equal(knowledge.startingPricesUSD.window, 8000);
  assert.deepEqual(knowledge.typicalRangesUSD.freestanding, [8000, 12000]);
  assert.deepEqual(knowledge.typicalRangesUSD.patioConversion, [12000, 18000]);
  assert.deepEqual(knowledge.typicalRangesUSD.newRoofAndEnclosure, [15000, 20000]);
  assert.deepEqual(knowledge.minimumBuildRangeUSD, [8000, 10000]);
  assert.match(knowledge.pricingGuidance, /not final quotes/i);
  assert.match(knowledge.pricingGuidance, /do not give the new-roof price as the default/i);
});

test('lead storage and live bookings are not represented as active', () => {
  assert.match(knowledge.projectCatalogPolicy.liveLookupStatus, /NOT_CONNECTED/);
  assert.match(knowledge.consultationScheduling.bookingStatus, /inactive/i);
  assert.equal(knowledge.intakePolicy.onlyClaimStoredAfterConfirmedWrite, true);
});
