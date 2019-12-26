import { esReindex } from '../esReindex/esReindex';
import { Client } from 'elasticsearch';
import { clearEs, setUpEs } from '../testLib/es';
import { addDays, formatISO } from 'date-fns';
import Lambda from '@dazn/lambda-powertools-lambda-client';

jest.mock('@dazn/lambda-powertools-lambda-client', () => ({
    invoke: jest.fn()
}));

const ES_INDEX = 'local-search-index';
const ES_ENDPOINT = process.env.ES_ENDPOINT || 'http://localhost:9200';

const es = Client({
    host: ES_ENDPOINT
});


const limits = {
    maxRecords: Number.MAX_VALUE,  // No limit on number of records, we collapse them in a single value
    maxSize: 256 * 1024,           // Amazon Lambda invocation payload accepts up to 256KiB per message
    maxUnitSize: 256 * 1024,       // Amazon Lambda invocation payload accepts up to 256KiB per message
    listOverhead: 16 + 36,         // Records are put in a JSON object "{\\"Records\\":[]} + the message is eveloped in {"Records":[{"Sns":{"Message":""}}]} to mimic SNS message"
    recordOverhead: 0,             // Records are just serialized
    interRecordOverhead: 1         // Records are comma separated
};

describe('reindexing es documents', () => {

    beforeEach(async () => {
        await setUpEs(es, ES_INDEX);
    });

    afterEach(async () => {
        await clearEs(es, [ES_INDEX]);
    });

    test('should reindex 0 documents', async () => {
        const deps = {
            es,
            index: ES_INDEX,
            limits,
            indexFn: 'index-fn'
        };

        const mockInvokeAsync = jest.fn();

        Lambda.invoke.mockImplementation((args) => {
            mockInvokeAsync(args);
            return {
                promise: () => { }
            };
        });

        const dataset = [
            {
                id: 'doc-1',
                text: 'doc 1',
                when: {
                    dateTime: {
                        from: formatISO(addDays(new Date(), -20)), //past
                        to: formatISO(addDays(new Date(), -1))
                    }
                }
            },
            {
                id: 'doc-2',
                text: 'doc 2',
                when: {
                    dateTime: {
                        from: formatISO(addDays(new Date(), 1)), //no further indexing needed
                        to: formatISO(addDays(new Date(), 89))
                    }
                }
            },
            {
                id: 'doc-3',
                text: 'doc 3',
                when: {
                    dateTime: {
                        from: formatISO(addDays(new Date(), 120)), //far future
                        to: formatISO(addDays(new Date(), 150))
                    }
                }
            },
            {
                id: 'doc-4',
                text: 'doc 4',
                when: {
                    dateTime: {
                        from: formatISO(addDays(new Date(), -20)),
                        to: formatISO(addDays(new Date(), 95))
                    }
                },
                type: 'EVENT' // don't index events
            }
        ];

        const body = dataset.flatMap(doc => [{ index: { _index: ES_INDEX } }, doc])

        await es.bulk({ refresh: true, body });

        await esReindex(deps)();

        expect(mockInvokeAsync).not.toHaveBeenCalled();
    });

    test('should reindex 3 documents', async () => {
        const deps = {
            es,
            index: ES_INDEX,
            limits,
            indexFn: 'index-fn'
        };

        const mockInvokeAsync = jest.fn();

        Lambda.invoke.mockImplementation((args) => {
            mockInvokeAsync(args);
            return {
                promise: () => { }
            };
        });

        const dataset = [
            {
                id: 'doc-1',
                text: 'doc 1',
                when: {
                    dateTime: {
                        from: formatISO(addDays(new Date(), -20)),
                        to: formatISO(addDays(new Date(), 95))
                    }
                }
            },
            {
                id: 'doc-2',
                text: 'doc 2',
                when: {
                    dateTime: {
                        from: formatISO(addDays(new Date(), 1)),
                        to: formatISO(addDays(new Date(), 120))
                    }
                }
            },
            {
                id: 'doc-3',
                text: 'doc 3',
                when: {
                    dateTime: {
                        from: formatISO(addDays(new Date(), 80)),
                        to: formatISO(addDays(new Date(), 150))
                    }
                }
            }
        ];

        const body = dataset.flatMap(doc => [{ index: { _index: ES_INDEX } }, doc])

        await es.bulk({ refresh: true, body });

        await esReindex(deps)();

        expect(mockInvokeAsync).toHaveBeenCalledTimes(1);
        expect(mockInvokeAsync).toHaveBeenCalledWith({
            FunctionName: 'index-fn',
            InvocationType: 'Event',
            Payload: JSON.stringify({
                Records: [
                    {
                        Sns: {
                            Message: JSON.stringify({ Records: dataset })
                        }
                    }
                ]
            })
        });
    });
});
