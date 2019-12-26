import { rejectThingToDo } from '../rejectThingToDo/rejectThingToDo';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { PENDING, PUBLISHED } from '../lib/thingToDoStatuses';
import { gsi1sk as rangeKey } from '../lib/entityTypes';
import { clearDb } from '../testLib/db';
import { REJECTED } from '../../content/lib/thingToDoStatuses';

const ddb = new DocumentClient({
    region: 'eu-central-1',
    endpoint: process.env.DYNAMODB_EINDPOINT || 'http://localhost:4569'
});

const DYNAMODB_ONE_TABLE = 'local-one-table';

describe('rejecting thing todo', () => {

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

        await expect(rejectThingToDo(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });

    test('should throw error when trying to reject thing todo not in PENDING status', async () => {
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

        await expect(rejectThingToDo(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });

    test('should reject thing todo', async () => {
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

        const result = await rejectThingToDo(deps)(event, {}, () => { });

        expect(result).toEqual({ ...item, gsi1sk: rangeKey(REJECTED, item.orgId), __event__: { type: 'TTD_REJECTED'} });
    });
});
