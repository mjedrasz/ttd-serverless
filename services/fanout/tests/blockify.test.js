import { blockify } from '../lib/ops';

describe('blockify list of records', () => {

  test('shoud return one block with 3 elements', () => {
    const limits = {
      maxRecords: Number.MAX_VALUE,  // No limit on number of records, we collapse them in a single value
      maxSize: 3500,             // Amazon SNS only accepts up to 256KiB per message
      maxUnitSize: 3500,         // Amazon SNS only accepts up to 256KiB per message
      listOverhead: 14,              // Records are put in a JSON object "{"Records":[]}"
      recordOverhead: 0,             // Records are just serialized
      interRecordOverhead: 1         // Records are comma separated
    };

    const records = [{ data: { name: 'aaa' }, size: 1000 }, { data: { name: 'bbb' }, size: 1000 }, { data: { name: 'ccc' }, size: 1000 }];

    const blocks = blockify(records, limits);

    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toEqual(expect.arrayContaining(records));
  });

  test('shoud return 3 block 1 element each', () => {
    const limits = {
      maxRecords: Number.MAX_VALUE,  // No limit on number of records, we collapse them in a single value
      maxSize: 1500,             // Amazon SNS only accepts up to 256KiB per message
      maxUnitSize: 1500,         // Amazon SNS only accepts up to 256KiB per message
      listOverhead: 14,              // Records are put in a JSON object "{"Records":[]}"
      recordOverhead: 0,             // Records are just serialized
      interRecordOverhead: 1         // Records are comma separated
    };

    const records = [{ data: { name: 'aaa' }, size: 1000 }, { data: { name: 'bbb' }, size: 1000 }, { data: { name: 'ccc' }, size: 1000 }];

    const blocks = blockify(records, limits);

    expect(blocks).toHaveLength(3)
    expect(blocks[0][0]).toEqual(records[0]);
    expect(blocks[1][0]).toEqual(records[1]);
    expect(blocks[2][0]).toEqual(records[2]);
  });  
  
  test('shoud return 3 block 1 element each', () => {
    const limits = {
      maxRecords: Number.MAX_VALUE,  // No limit on number of records, we collapse them in a single value
      maxSize: 1500,             // Amazon SNS only accepts up to 256KiB per message
      maxUnitSize: 1500,         // Amazon SNS only accepts up to 256KiB per message
      listOverhead: 14,              // Records are put in a JSON object "{"Records":[]}"
      recordOverhead: 0,             // Records are just serialized
      interRecordOverhead: 1         // Records are comma separated
    };

    const records = [{ data: { name: 'aaa' }, size: 1000 }, { data: { name: 'bbb' }, size: 1000 }, { data: { name: 'ccc' }, size: 1000 }];

    const blocks = blockify(records, limits);

    expect(blocks).toHaveLength(3)
    expect(blocks[0][0]).toEqual(records[0]);
    expect(blocks[1][0]).toEqual(records[1]);
    expect(blocks[2][0]).toEqual(records[2]);
  });

  test('shoud return 2 blocks with 1 and 2 elements', () => {
    const limits = {
      maxRecords: Number.MAX_VALUE,  // No limit on number of records, we collapse them in a single value
      maxSize: 1500,             // Amazon SNS only accepts up to 256KiB per message
      maxUnitSize: 1500,         // Amazon SNS only accepts up to 256KiB per message
      listOverhead: 14,              // Records are put in a JSON object "{"Records":[]}"
      recordOverhead: 0,             // Records are just serialized
      interRecordOverhead: 1         // Records are comma separated
    };

    const records = [{ data: { name: 'aaa' }, size: 1000 }, { data: { name: 'bbb' }, size: 700 }, { data: { name: 'ccc' }, size: 700 }];

    const blocks = blockify(records, limits);

    expect(blocks).toHaveLength(2)
    expect(blocks[0][0]).toEqual(records[0]);
    expect(blocks[1][0]).toEqual(records[1]);
    expect(blocks[1][1]).toEqual(records[2]);
  });

  test('shoud return 0 blocks (max exceeded)', () => {
    const limits = {
      maxRecords: Number.MAX_VALUE,  // No limit on number of records, we collapse them in a single value
      maxSize: 1500,             // Amazon SNS only accepts up to 256KiB per message
      maxUnitSize: 1500,         // Amazon SNS only accepts up to 256KiB per message
      listOverhead: 14,              // Records are put in a JSON object "{"Records":[]}"
      recordOverhead: 0,             // Records are just serialized
      interRecordOverhead: 1         // Records are comma separated
    };

    const records = [{ data: { name: 'aaa' }, size: 1600 }, { data: { name: 'bbb' }, size: 1487 }, { data: { name: 'ccc' }, size: 1500 }];

    const blocks = blockify(records, limits);

    expect(blocks).toHaveLength(0)
  });

});


