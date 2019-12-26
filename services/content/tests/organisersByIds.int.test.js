import { organisersByIds } from '../organisersByIds/organisersByIds';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as EntityType from '../lib/entityTypes';
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

        const events = [{ source: { orgId: 'orgid-1' } },
        { source: { orgId: 'orgid-2' } }];

        const result = await organisersByIds(deps)(events, {}, () => { });

        expect(result).toHaveLength(events.length);
    });


    test('should get list the size of the given ids list with some values in the ids order', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const item = { sk: EntityType.USER, name: 'name1'}

        const events = [{ source: { orgId: 'orgid-1' } },
        { source: { orgId: 'orgid-2' } }];

        await ddb.put({ TableName: deps.tableName, Item: { ...item, id: events[1].source.orgId} }).promise();

        const result = await organisersByIds(deps)(events, {}, () => { });

        expect(result).toHaveLength(events.length);
        expect(result[1]).toBeDefined();
        expect(result[1].id).toEqual(events[1].source.orgId);
        expect(result[0]).toBeNull();
    });

    test('should get list the size of the given ids list with all values in the ids order', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const organiser = { sk: EntityType.USER, name: 'name'}

        const events = [{ source: { orgId: 'orgid-1' } },
        { source: { orgId: 'orgid-2' } }];

        await ddb.put({ TableName: deps.tableName, Item:  {...organiser, id: events[1].source.orgId } }).promise();
        await ddb.put({ TableName: deps.tableName, Item:  {...organiser, id: events[0].source.orgId } }).promise();

        const result = await organisersByIds(deps)(events, {}, () => { });

        expect(result).toHaveLength(events.length);
        expect(result[0]).toBeDefined();
        expect(result[0].id).toEqual(events[0].source.orgId);
        expect(result[1]).toBeDefined();
        expect(result[1].id).toEqual(events[1].source.orgId);
    });

    test('should get list the size of the given ids list with all values the same', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const organiser = { sk: EntityType.USER, name: 'name'}

        const events = [{ source: { orgId: 'orgid-2' } },
        { source: { orgId: 'orgid-2' } }];

        await ddb.put({ TableName: deps.tableName, Item: { ...organiser, id: events[1].source.orgId} }).promise();

        const result = await organisersByIds(deps)(events, {}, () => { });

        expect(result).toHaveLength(events.length);
        expect(result[0]).toBeDefined();
        expect(result[0].id).toEqual(events[0].source.orgId);
        expect(result[1]).toBeDefined();
        expect(result[1].id).toEqual(events[0].source.orgId);
    });
});
