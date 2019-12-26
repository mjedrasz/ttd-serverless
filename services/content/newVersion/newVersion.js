import logger from '@dazn/lambda-powertools-logger';
import { DRAFT, PUBLISHED } from '../lib/thingToDoStatuses';
import { THING_TODO, gsi1sk as rangeKey } from '../lib/entityTypes';

const chance = require('chance').Chance();

const newVersion = ({ ddb, tableName }) => async (event) => {

    const buildNewThingToDo = (thingToDo, ttdId, orgId) => {
        const id = chance.guid();
        const gsi1sk = rangeKey(DRAFT, orgId);

        return {
            ...thingToDo,
            id,
            gsi1sk,
            ttdId,
            __event__: {
                type: 'TTD_NEW_VERSION_CREATED'
            }
        };
    };

    const validThingToDoFound = (thingToDo) => thingToDo && thingToDo.gsi1sk == rangeKey(PUBLISHED, orgId);

    logger.debug('received', { event });

    const { ttdId, orgId } = event;

    const getRequest = {
        TableName: tableName,
        Key: {
            id: ttdId,
            sk: THING_TODO
        }
    };

    logger.debug('getting thing todo by id', { request: getRequest });

    const { Item: thingToDo } = await ddb.get(getRequest).promise();

    if (validThingToDoFound(thingToDo, orgId)) {

        const newThingToDo = buildNewThingToDo(thingToDo, ttdId, orgId);

        const putRequest = {
            Item: newThingToDo,
            TableName: tableName
        };

        logger.debug('putting in dynamodb', { request: putRequest });

        await ddb.put(putRequest).promise();

        logger.debug('returning', { newThingToDo });

        return newThingToDo;

    } else {
        logger.error('valid thing todo not found', { ttdId });
        throw new Error('valid thing todo not found');
    }
};

export { newVersion };