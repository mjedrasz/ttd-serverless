import { bookThingToDo } from '../bookThingToDo/bookThingToDo';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { PENDING, } from '../lib/thingToDoStatuses';
import { gsi1sk as rangeKey } from '../lib/entityTypes';
import { clearDb } from '../testLib/db';

const ddb = new DocumentClient({
    region: 'eu-central-1',
    endpoint: process.env.DYNAMODB_EINDPOINT || 'http://localhost:4569'
});

const DYNAMODB_ONE_TABLE = 'local-one-table';

describe('booking thing todo', () => {

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
            userId: 'userid-1',
            peopleNo: 3,
            date: '2019-12-12T12:00:00Z'
        };

        await expect(bookThingToDo(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });

    test('should throw error when trying to book thing todo not in PUBLISH status', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const event = {
            ttdId: 'ttdid-1',
            userId: 'userid-1',
            peopleNo: 3,
            date: '2019-12-12T12:00:00Z'
        };

        const item = {
            ...require('./data/draftDbPlace.json'),
            orgId: 'orgid-1',
            id: event.ttdId,
            gsi1sk: rangeKey(PENDING, 'orgid-1')
        };

        await ddb.put({ TableName: deps.tableName, Item: item }).promise();

        await expect(bookThingToDo(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });
});
