import { initProfile } from '../initProfile/initProfile';
import { USER } from '../lib/entityTypes';
import {DocumentClient} from 'aws-sdk/clients/dynamodb';
import { clearDb } from '../testLib/db';

const ddb = new DocumentClient({
    region: 'eu-central-1',
    endpoint: process.env.DYNAMODB_EINDPOINT || 'http://localhost:4569'
});
const DYNAMODB_ONE_TABLE = 'local-one-table';

describe('creating user/organiser initial profiles', () => {

    afterEach(async () => {
        await clearDb(ddb, DYNAMODB_ONE_TABLE);
    });

    test('should create organiser profile', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };
        const event = {
            request: {
                userAttributes: {
                    sub: 'orgid-1',
                    name: 'orgname'
                }
            }
        };
        const result = await initProfile(deps)(event, {}, () => { });
        const response = await ddb.get({
            TableName: deps.tableName,
            Key: {
                id: event.request.userAttributes.sub,
                sk: USER
            }
        }).promise();
        
        expect(response.Item).toBeDefined();
        expect(response.Item.name).toEqual(event.request.userAttributes.name);
        expect(result).toBe(event);
    });

    test('should create user profile', async () => {
        const deps = {
            ddb: ddb,
            tableName: DYNAMODB_ONE_TABLE
        };
        const event = {
            request: {
                userAttributes: {
                    sub: 'userid-1'
                }
            }
        };
        const result = await initProfile(deps)(event, {}, () => { });
        const response = await ddb.get({
            TableName: deps.tableName,
            Key: {
                id: event.request.userAttributes.sub,
                sk: USER
            }
        }).promise();

        expect(response.Item).toBeDefined();
        expect(result).toBe(event);
    });
});
