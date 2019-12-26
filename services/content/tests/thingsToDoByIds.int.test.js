import { thingsToDoByIds } from '../thingsToDoByIds/thingsToDoByIds';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { clearDb } from '../testLib/db';

const ddb = new DocumentClient({
    region: 'eu-central-1',
    endpoint: process.env.DYNAMODB_EINDPOINT || 'http://localhost:4569'
});

const DYNAMODB_ONE_TABLE = 'local-one-table';

describe('getting things todo by ids', () => {

    afterEach(async () => {
        await clearDb(ddb,DYNAMODB_ONE_TABLE);
    });

    test('should get empty list the size of the given ids list when nothing found', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const events = [{ source: { id: 'ttdid-1' } },
        { source: { id: 'ttdid-2' } }];

        const result = await thingsToDoByIds(deps)(events, {}, () => { });

        expect(result).toHaveLength(events.length);
    });


    test('should get list the size of the given ids list with some values in the ids order', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const item = require('./data/draftDbPlace.json');

        const events = [{ source: { id: 'ttdid-1' } },
        { source: { id: 'ttdid-2' } }];

        await ddb.put({ TableName: deps.tableName, Item: {...item, id: events[0].source.id } }).promise();

        const result = await thingsToDoByIds(deps)(events, {}, () => { });

        expect(result).toHaveLength(events.length);
        expect(result[0]).toBeDefined();
        expect(result[0].id).toEqual(events[0].source.id);
        expect(result[1]).toBeNull();
    });

    test('should get list the size of the given ids list with all values in the ids order', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const item = require('./data/draftDbPlace.json');

        const events = [{ source: { id: 'ttdid-1' } },
        { source: { id: 'ttdid-2' } }];

        await ddb.put({ TableName: deps.tableName, Item:  {...item, id: events[1].source.id } }).promise();
        await ddb.put({ TableName: deps.tableName, Item:  {...item, id: events[0].source.id } }).promise();

        const result = await thingsToDoByIds(deps)(events, {}, () => { });

        expect(result).toHaveLength(events.length);
        expect(result[0]).toBeDefined();
        expect(result[0].id).toEqual(events[0].source.id);
        expect(result[1]).toBeDefined();
        expect(result[1].id).toEqual(events[1].source.id);
    });
});
