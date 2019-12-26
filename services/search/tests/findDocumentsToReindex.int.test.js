import { findDocumentsToReindex } from '../esReindex/esReindex';
import { Client } from 'elasticsearch';
import { clearEs, setUpEs } from '../testLib/es';
import { addDays, formatISO } from 'date-fns';

const ES_INDEX = 'local-search-index';
const ES_ENDPOINT = process.env.ES_ENDPOINT || 'http://localhost:9200';

const es = Client({
    host: ES_ENDPOINT
});


describe('find documents to reindex', () => {

    beforeEach(async () => {
        await setUpEs(es, ES_INDEX);
    });

    afterEach(async () => {
        await clearEs(es, [ES_INDEX]);
    });

    test('should find 0 documents', async () => {

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

        const docs = await findDocumentsToReindex({ es, index: ES_INDEX });

        expect(docs).toHaveLength(0);
    });

    test('should reindex 3 documents', async () => {

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

        const docs = await findDocumentsToReindex({ es, index: ES_INDEX });

        expect(docs).toHaveLength(3);
    });
});
