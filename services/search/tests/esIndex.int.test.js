import { esIndex } from '../esIndex/esIndex';
import { Client } from 'elasticsearch';
import { clearEs, setUpEs } from '../testLib/es';
import { THING_TODO, USER, gsi1sk as rangeKey } from '../lib/entityTypes';
import { PUBLISHED } from '../lib/thingToDoStatuses';
import { clearDb } from '../testLib/db';
import { format, addDays } from 'date-fns';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

const ES_INDEX = 'local-search-index';
const ES_ENDPOINT = process.env.ES_ENDPOINT || 'http://localhost:9200';
const DYNAMODB_ONE_TABLE = 'local-one-table';

const es = Client({
    host: ES_ENDPOINT
});

const ddb = new DocumentClient({
    region: 'eu-central-1',
    endpoint: process.env.DYNAMODB_EINDPOINT || 'http://localhost:4569'
});

describe('indexing es documents', () => {

    beforeEach(async () => {
        await setUpEs(es, ES_INDEX);
    });

    afterEach(async () => {
        await clearEs(es, [ES_INDEX]);
        await clearDb(ddb, DYNAMODB_ONE_TABLE);

    });

    test('should index documents', async () => {
        const deps = {
            es,
            ddb,
            tableName: DYNAMODB_ONE_TABLE,
            index: ES_INDEX
        };

        const organiser1 = { sk: USER, name: 'name1', id: 'orgid-1' };
        const organiser2 = { sk: USER, name: 'name2', id: 'orgid-2' };

        const when = (from, to) => ({
            dateTime: {
                from,
                to
            },
            occurrences: []
        });

        const schedule = (from, to) => ({
            dateTime: {
                from,
                to
            },
            occurrences: [
                {
                    dayOfWeek: "MON",
                    hours: {
                        "from": "10:00:00Z",
                        "to": "12:00:00Z"
                    }
                },
                {
                    dayOfWeek: "TUE",
                    hours: {
                        from: "14:00:00Z",
                        to: "18:00:00Z"
                    }
                }
            ]
        });

        await ddb.put({ TableName: deps.tableName, Item: organiser1 }).promise();
        await ddb.put({ TableName: deps.tableName, Item: organiser2 }).promise();

        const item1 = {
            ...require('./data/draftDbPlace.json'),
            id: 'ttdid-1',
            orgId: organiser1.id,
            gsi1sk: rangeKey(PUBLISHED, organiser1.id),
            schedule: schedule(format(addDays(new Date(), 4), "yyyy-MM-dd'T'HH:mm:ssX"),
                format(addDays(new Date(), 44), "yyyy-MM-dd'T'HH:mm:ssX"))
        };

        const item2 = {
            ...require('./data/draftDbPlace.json'),
            id: 'ttdid-2',
            orgId: organiser1.id,
            gsi1sk: rangeKey(PUBLISHED, organiser1.id),
            when: schedule(format(addDays(new Date(), -2), "yyyy-MM-dd'T'HH:mm:ssX"),
                format(addDays(new Date(), 100), "yyyy-MM-dd'T'HH:mm:ssX"))
        };

        const item3 = {
            ...require('./data/draftDbPlace.json'),
            id: 'ttdid-3',
            orgId: organiser2.id,
            gsi1sk: rangeKey(PUBLISHED, organiser2.id),
            when: schedule(format(new Date(), "yyyy-MM-dd'T'HH:mm:ssX"),
                format(addDays(new Date(), 200), "yyyy-MM-dd'T'HH:mm:ssX"))
        };

        const item4 = {
            ...require('./data/draftDbEvent.json'),
            id: 'ttdid-4',
            orgId: organiser2.id,
            gsi1sk: rangeKey(PUBLISHED, organiser2.id),
            when: when(format(new Date(), "yyyy-MM-dd'T'HH:mm:ssX"),
                format(addDays(new Date(), 10), "yyyy-MM-dd'T'HH:mm:ssX"))
        };

        const message = {
            Records: [
                {
                    ...item1,
                    sk: THING_TODO
                },
                {
                    ...item2,
                    sk: THING_TODO
                },
                {
                    ...item3,
                    sk: THING_TODO
                },
                {
                    ...item4,
                    sk: THING_TODO
                },
            ]
        };

        const event = {
            Records: [
                {
                    EventSource: 'aws:sns',
                    EventVersion: '1.0',
                    Sns: {
                        Type: 'Notification',
                        Message: JSON.stringify(message)
                    }
                }
            ]
        };

        const response = await esIndex(deps)(event);
        expect(response).toBe(true);

        const result = await es.search({
            index: ES_INDEX,
            body: {
                query: {
                    match_all: {}
                }
            }
        });
        expect(result.hits.total.value).toBe(4);
        expect(result.hits.hits.map(({ _source: doc }) => ({ id: doc.id, organiser: doc.__meta__.organiser }))).toEqual(
            expect.arrayContaining([
                { id: item3.id, organiser: organiser2.name },
                { id: item4.id, organiser: organiser2.name },
                { id: item1.id, organiser: organiser1.name },
                { id: item2.id, organiser: organiser1.name },
            ]));

    });
});
