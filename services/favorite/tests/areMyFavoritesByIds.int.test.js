import { areFavoritesByIds } from '../areFavoritesByIds/areFavoritesByIds';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { ACTIVE } from '../lib/favoriteStatuses';
import { skFavorite } from '../lib/entityTypes';
import { clearDb } from '../testLib/db';

const ddb = new DocumentClient({
    region: 'eu-central-1',
    endpoint: process.env.DYNAMODB_EINDPOINT || 'http://localhost:4569'
});

const DYNAMODB_ONE_TABLE = 'local-one-table';

describe('getting organisers by ids', () => {

    afterEach(async () => {
        await clearDb(ddb, DYNAMODB_ONE_TABLE);
    });

    test('should get empty list the size of the given ids list when nothing found', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const events = [{ source: { id: 'ttdid-1' }, userId: 'userid-1' },
        { source: { id: 'ttdid-2' }, userId: 'userid-1' }];

        const result = await areFavoritesByIds(deps)(events, {}, () => { });

        expect(result).toHaveLength(events.length);
    });


    test('should get list the size of the given ids list with some values in the ids order', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const events = [{ source: { id: 'ttdid-1' }, userId: 'userid-1' },
        { source: { id: 'ttdid-2' }, userId: 'userid-1' }];

        const item = { id: events[1].source.id, sk: skFavorite(events[0].userId), gsi1sk: ACTIVE }

        await ddb.put({ TableName: deps.tableName, Item: item }).promise();

        const result = await areFavoritesByIds(deps)(events, {}, () => { });

        expect(result).toHaveLength(events.length);
        expect(result).toEqual([false, true]);
    });

    test('should get list the size of the given ids list with all values in the ids order', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const events = [{ source: { id: 'ttdid-1' }, userId: 'userid-1' },
        { source: { id: 'ttdid-2' }, userId: 'userid-1' }];

        const item1 = { id: events[0].source.id, sk:  skFavorite(events[0].userId), gsi1sk: ACTIVE }
        const item2 = { id: events[1].source.id, sk:  skFavorite(events[1].userId), gsi1sk: ACTIVE }

        await ddb.put({ TableName: deps.tableName, Item: item1 }).promise();
        await ddb.put({ TableName: deps.tableName, Item: item2 }).promise();

        const result = await areFavoritesByIds(deps)(events, {}, () => { });

        expect(result).toHaveLength(events.length);
        expect(result).toEqual([true, true]);
    });
});
