import { updateThingToDo } from '../updateThingToDo/updateThingToDo';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DRAFT } from '../lib/thingToDoStatuses';
import { THING_TODO, gsi1sk as rangeKey } from '../lib/entityTypes';
import { clearDb } from '../testLib/db';

const ddb = new DocumentClient({
    region: 'eu-central-1',
    endpoint: process.env.DYNAMODB_EINDPOINT || 'http://localhost:4569'
});

const DYNAMODB_ONE_TABLE = 'local-one-table';

describe('updating thing todo', () => {

    afterEach(async () => {
        await clearDb(ddb, DYNAMODB_ONE_TABLE);
    });

    test('should update thing todo', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };
        const item = {
            ...require('./data/draftDbPlace.json'),
            orgId: 'orgid-1',
            gsi1sk: rangeKey(DRAFT, 'orgid-1')
        }

        const place = require('./data/draftPlace.json');

        const event = {
            thingToDo: {
                ...place.thingToDo,
                name: 'newname',
            },
            ttdId: item.id,
            orgId: item.orgId
        };

        await ddb.put({ TableName: deps.tableName, Item: item }).promise();

        const { id, sk, gsi1sk } = await updateThingToDo(deps)(event, {}, () => { });

        expect(id).toBeDefined();
        expect(sk).toEqual(THING_TODO);
        expect(gsi1sk).toEqual(rangeKey(DRAFT, event.orgId));

        const response = await ddb.get({
            TableName: deps.tableName,
            Key: {
                id,
                sk: THING_TODO
            }
        }).promise();

        expect(response.Item).toBeDefined();
        expect(response.Item.name).toEqual(event.thingToDo.name);
    });

    test('should throw error when trying to update a place of another organiser', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };
        const item = require('./data/draftDbPlace.json');
        const place = require('./data/draftPlace.json');

        const event = {
            thingToDo: {
                ...place.thingToDo,
                name: 'newname'
            },
            ttdId: item.id,
            orgId: 'notowner'
        };

        await ddb.put({ TableName: deps.tableName, Item: item }).promise();

        await expect(updateThingToDo(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });
});
