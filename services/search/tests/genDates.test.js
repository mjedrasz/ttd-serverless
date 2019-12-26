import datesFromCron from '../lib/genDates';

describe('generating dates', () => {

  test('generates dates within given range', () => {
    const iterator = datesFromCron("0 0 * * MON", "2019-01-01", "2019-01-31");
    expect(iterator.next().value.toISOString()).toBe("2019-01-07T00:00:00.000Z");
    expect(iterator.next().value.toISOString()).toBe("2019-01-14T00:00:00.000Z");
    expect(iterator.next().value.toISOString()).toBe("2019-01-21T00:00:00.000Z");
    expect(iterator.next().value.toISOString()).toBe("2019-01-28T00:00:00.000Z");
    expect(iterator.next().done).toBe(true);
  });

  test('no dates when end date is before start date', () => {
    const iterator = datesFromCron("0 0 * * MON", "2019-01-01", "2018-01-31");
    expect(iterator.next().done).toBe(true);
  });
});

