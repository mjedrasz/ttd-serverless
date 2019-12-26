import { approveThingToDo } from '../approveThingToDo/approveThingToDo';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { PENDING, PUBLISHED, DELETED } from '../lib/thingToDoStatuses';
import { THING_TODO, gsi1sk as rangeKey } from '../lib/entityTypes';
import { clearDb } from '../testLib/db';

const ddb = new DocumentClient({
    region: 'eu-central-1',
    endpoint: process.env.DYNAMODB_EINDPOINT || 'http://localhost:4569'
});

const DYNAMODB_ONE_TABLE = 'local-one-table';

describe('approving thing todo', () => {

    afterEach(async () => {
        await clearDb(ddb, DYNAMODB_ONE_TABLE);
    });

    test('should throw execption when no existing thing todo found', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const event = {
            ttdId: 'non-existing-id-1',
            orgId: 'orgid-1'
        };

        await expect(approveThingToDo(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });

    test('should throw error when trying to approve thing todo not in PENDING status', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const event = {
            ttdId: 'ttdid-id-1'
        };

        const item = {
            ...require('./data/draftDbPlace.json'),
            orgId: 'orgid-1',
            id: event.ttdId,
            gsi1sk: rangeKey(PUBLISHED, 'orgid-1')
        };

        await ddb.put({ TableName: deps.tableName, Item: item }).promise();

        await expect(approveThingToDo(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });

    test('should approve thing todo', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };
        const event = {
            ttdId: 'ttdid-1'
        };

        const item = {
            ...require('./data/draftDbPlace.json'),
            id: event.ttdId,
            orgId: 'orgid-1',
            gsi1sk: rangeKey(PENDING, 'orgid-1')
        };

        await ddb.put({ TableName: deps.tableName, Item: item }).promise();

        const result = await approveThingToDo(deps)(event, {}, () => { });

        expect(result).toEqual({ ...item, gsi1sk: rangeKey(PUBLISHED, item.orgId) });
    });

    test('should approve new version of thing todo', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };
        const event = {
            ttdId: 'ttdid-1'
        };

        const publishedItem = {
            ...require('./data/draftDbPlace.json'),
            id: 'ttdid-0',
            orgId: 'orgid-1',
            description: 'i am published',
            gsi1sk: rangeKey(PUBLISHED, 'orgid-1')
        };
        const newVersionItem = {
            ...require('./data/draftDbPlace.json'),
            id: event.ttdId,
            orgId: publishedItem.orgId,
            description: 'i am improved',
            ttdId: publishedItem.id,
            gsi1sk: rangeKey(PENDING, publishedItem.orgId)
        };

        await ddb.put({ TableName: deps.tableName, Item: publishedItem }).promise();
        await ddb.put({ TableName: deps.tableName, Item: newVersionItem }).promise();

        const result = await approveThingToDo(deps)(event, {}, () => { });

        expect(result).toEqual({ ...newVersionItem, gsi1sk: rangeKey(PUBLISHED, publishedItem.orgId), id: publishedItem.id });

        const published = await ddb.get({
            TableName: deps.tableName,
            Key: {
                id: publishedItem.id,
                sk: THING_TODO
            }
        }).promise();

        const newVersion = await ddb.get({
            TableName: deps.tableName,
            Key: {
                id: newVersionItem.id,
                sk: THING_TODO
            }
        }).promise();

        expect(published.Item).toBeDefined();
        expect(newVersion.Item).toBeDefined();
        expect(published.Item).toEqual({
            ...newVersionItem,
            gsi1sk: rangeKey(PUBLISHED, publishedItem.orgId),
            id: publishedItem.id,
            __event__: { type: 'TTD_APPROVED' }
        });
        expect(newVersion.Item.gsi1sk).toEqual(rangeKey(DELETED, newVersionItem.orgId));

    });
});
