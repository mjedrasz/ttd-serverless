import { createThingToDo } from '../createThingToDo/createThingToDo';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { DRAFT } from '../lib/thingToDoStatuses';
import { THING_TODO, gsi1sk as rangeKey } from '../lib/entityTypes';
import { clearDb } from '../testLib/db';

const ddb = new DocumentClient({
    region: 'eu-central-1',
    endpoint: process.env.DYNAMODB_EINDPOINT || 'http://localhost:4569'
});
const DYNAMODB_ONE_TABLE = 'local-one-table';

describe('creating thing todo', () => {

    afterEach(async () => {
        await clearDb(ddb, DYNAMODB_ONE_TABLE);
    });

    test('should create a place', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };
        const event = require('./data/draftPlace.json');

        const { id, sk, gsi1sk } = await createThingToDo(deps)(event, {}, () => { });

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
    });
});
