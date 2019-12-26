import { groupBy } from '../lib/ops';

describe('group by list of records', () => {

  test('shoud return 2 groups', () => {

    const records = [{ data: { name: 'aaa' }, size: 1000 }, { data: { name: 'bbb' }, size: 1000 }, { data: { name: 'aaa' }, size: 1000 }];

    const grouped = groupBy(records, record => record.data.name);

    expect(Array.from(grouped.keys())).toEqual(expect.arrayContaining(['aaa', 'bbb']));
  });


  test('shoud return 1 group', () => {

    const records = [{ data: { name: 'aaa' }, size: 1000 }, { data: { name: 'bbb' }, size: 1000 }, { data: { name: 'aaa' }, size: 1000 }];

    const grouped = groupBy(records, record => record.size);

    expect(Array.from(grouped.keys())).toEqual(expect.arrayContaining([1000]));
  });

});


