const blockify = (records, limits) => {
    const maxRecords = limits.maxRecords;
    const maxSize = limits.maxSize;
    const maxUnitSize = limits.maxUnitSize;
    const listOverhead = limits.listOverhead;
    const recordOverhead = limits.recordOverhead;
    const interRecordOverhead = limits.interRecordOverhead;

    // Filter invalid records
    records = records.filter(record => {
        const size = record.size;
        if ((size + listOverhead + recordOverhead) > maxUnitSize) {
            console.log("Record too large to be sent", { record });
            return false;
        } else {
            return true;
        }
    });

    // Group records per block
    const maxRecordsPerBlock = maxRecords;
    const blocks = [];
    let blockSize = listOverhead;
    let block = [];
    while (records.length > 0) {
        const record = records.shift();
        const recordSize = record.size + recordOverhead + (block.length > 0 ? interRecordOverhead : 0);

        if (((blockSize + recordSize) > maxSize) || (block.length >= maxRecordsPerBlock)) {
            // Block full, start a new block
            blocks.push(block);
            block = [];
            blockSize = listOverhead;
        }

        // Add the record to the records to send
        blockSize = blockSize + recordSize;
        block.push(record);
    }
    if (block.length > 0) {
        blocks.push(block);
        block = [];
    }
    return blocks;
};

const groupBy = (xs, keyFn) => {
    return xs.reduce((acc, v) => {
        const key = keyFn(v);
        const col = acc.get(key);
        if (!col) {
            acc.set(key, [v]);
        } else {
            col.push(v);
        }
        return acc;
    }, new Map());
};

export {
    blockify,
    groupBy
};