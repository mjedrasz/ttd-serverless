import { newVersion } from '../newVersion/newVersion';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DRAFT, PUBLISHED } from '../lib/thingToDoStatuses';
import { gsi1sk as rangeKey } from '../lib/entityTypes';
import { clearDb } from '../testLib/db';

const ddb = new DocumentClient({
    region: 'eu-central-1',
    endpoint: process.env.DYNAMODB_EINDPOINT || 'http://localhost:4569'
});

const DYNAMODB_ONE_TABLE = 'local-one-table';

describe('creating new version', () => {

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

        await expect(newVersion(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });

    test('should throw error when trying to create a new version of item belonging to another organiser', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const event = {
            ttdId: 'non-existing-id-1',
            orgId: 'orgid-1'
        };

        const item = {
            ...require('./data/draftDbPlace.json'),
            orgId: 'other-orgid',
            id: event.ttdId,
            gsi1sk: rangeKey(PUBLISHED, 'other-orgid')
        };

        await ddb.put({ TableName: deps.tableName, Item: item }).promise();

        await expect(newVersion(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });

    test('should throw error when trying to create a new version of item not in PUBLISHED status', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const event = {
            ttdId: 'non-existing-id-1',
            orgId: 'orgid-1'
        };

        const item = {
            ...require('./data/draftDbPlace.json'),
            orgId: event.orgId,
            id: event.ttdId,
            gsi1sk: rangeKey(DRAFT, event.orgId)
        };

        await ddb.put({ TableName: deps.tableName, Item: item }).promise();

        await expect(newVersion(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });

    test('should create a new version', async () => {
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

        const result = await newVersion(deps)(event, {}, () => { });

        expect(result.id).not.toEqual(item.id);
        expect(result.gsi1sk).toEqual(rangeKey(DRAFT, event.orgId));
        expect({ ...result, id: '', gsi1sk: '' }).toEqual({
            ...item, id: '', gsi1sk: '',
            ttdId: event.ttdId, __event__: { type: 'TTD_NEW_VERSION_CREATED' }
        });
    });
});
