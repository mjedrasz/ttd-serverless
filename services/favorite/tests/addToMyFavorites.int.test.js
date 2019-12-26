import { addToMyFavorites } from '../addToMyFavorites/addToMyFavorites';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { PENDING, PUBLISHED, } from '../lib/thingToDoStatuses';
import { FAVORITE, gsi1sk as rangeKey, skFavorite } from '../lib/entityTypes';
import { clearDb } from '../testLib/db';
import { ACTIVE } from '../lib/favoriteStatuses';

const ddb = new DocumentClient({
    region: 'eu-central-1',
    endpoint: process.env.DYNAMODB_EINDPOINT || 'http://localhost:4569'
});

const DYNAMODB_ONE_TABLE = 'local-one-table';

describe('adding thing todo to favorites', () => {

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
            userId: 'userid-1'
        };

        await expect(addToMyFavorites(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });

    test('should throw error when trying to add to favorites thing todo not in PUBLISH status', async () => {
        const deps = {
            ddb,
            tableName: DYNAMODB_ONE_TABLE
        };

        const event = {
            ttdId: 'ttdid-1',
            userId: 'userid-1'
        };

        const item = {
            ...require('./data/draftDbPlace.json'),
            orgId: 'orgid-1',
            id: event.ttdId,
            gsi1sk: rangeKey(PENDING, 'orgid-1')
        };

        await ddb.put({ TableName: deps.tableName, Item: item }).promise();

        await expect(addToMyFavorites(deps)(event, {}, () => { })).rejects.toThrow('valid thing todo not found');
    });

    test('should add to favorites', async () => {
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
            id: event.ttdId,
            orgId: 'orgid-1',
            gsi1sk: rangeKey(PUBLISHED, 'orgid-1')
        };

        await ddb.put({ TableName: deps.tableName, Item: item }).promise();

        const result = await addToMyFavorites(deps)(event, {}, () => { });

        expect(result).toEqual({
            id: event.ttdId,
            sk: skFavorite(event.userId),
            gsi1sk: ACTIVE,
            __event__: {
                type: 'FAV_ADDED'
            }
        });
    });

});
