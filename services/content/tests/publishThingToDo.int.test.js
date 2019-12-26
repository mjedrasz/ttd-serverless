import { publishThingToDo } from '../publishThingToDo/publishThingToDo';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DRAFT, PENDING, PUBLISHED } from '../lib/thingToDoStatuses';
import { gsi1sk as rangeKey } from '../lib/entityTypes';
import { clearDb } from '../testLib/db';

const ddb = new DocumentClient({
    region: 'eu-central-1',
    endpoint: process.env.DYNAMODB_EINDPOINT || 'http://localhost:4569'
});

const DYNAMODB_ONE_TABLE = 'local-one-table';

describe('publishing thing todo', () => {

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

        await expect(publishThingToDo(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });

    test('should throw error when trying to publish item belonging to another organiser', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const event = {
            ttdId: 'ttdid-1',
            orgId: 'orgid-1'
        };

        const item = {
            ...require('./data/draftDbPlace.json'),
            orgId: 'other-orgid',
            id: event.ttdId,
            gsi1sk: rangeKey(DRAFT, 'other-orgid')
        };

        await ddb.put({ TableName: deps.tableName, Item: item }).promise();

        await expect(publishThingToDo(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });

    test('should throw error when trying to publish thing todo not in DRAFT status', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const event = {
            ttdId: 'ttdid-1',
            orgId: 'orgid-1'
        };

        const item = {
            ...require('./data/draftDbPlace.json'),
            orgId: event.orgId,
            id: event.ttdId,
            gsi1sk: rangeKey(PUBLISHED, event.orgId)
        };

        await ddb.put({ TableName: deps.tableName, Item: item }).promise();

        await expect(publishThingToDo(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });

    test('should publish thing todo', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };
        const event = {
            ttdId: 'ttdid-1',
            orgId: 'orgid-1'
        };

        const item = {
            ...require('./data/draftDbPlace.json'),
            orgId: event.orgId,
            id: event.ttdId,
            gsi1sk: rangeKey(DRAFT, event.orgId)
        };

        await ddb.put({ TableName: deps.tableName, Item: item }).promise();

        const result = await publishThingToDo(deps)(event, {}, () => { });

        expect(result.gsi1sk).toEqual(rangeKey(PENDING, event.orgId));
        expect({ ...result, gsi1sk: '' }).toEqual({ ...item, gsi1sk: '', __event__: { type: 'TTD_PUBLISHED' } });
    });
});
