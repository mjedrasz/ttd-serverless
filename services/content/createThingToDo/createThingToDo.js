import logger from '@dazn/lambda-powertools-logger';
import { DRAFT } from '../lib/thingToDoStatuses';
import { THING_TODO, gsi1sk as rangeKey} from '../lib/entityTypes';

const chance = require('chance').Chance();

const createThingToDo = ({ ddb, tableName }) => async (event) => {

    const buildThingToDo = ({ thingToDo }) => {
        const orgId = event.orgId;
        const ttdId = chance.guid();
        return {
            ...thingToDo,
            id: ttdId,
            sk: THING_TODO,
            gsi1sk: rangeKey(DRAFT, orgId),
            orgId,
            __event__: {
                type: 'TTD_CREATED'
            }
        };
    };

    logger.debug('received', { event });

    const thingToDo = buildThingToDo(event);
    const request = {
        Item: thingToDo,
        TableName: tableName
    };

    logger.debug('putting in dynamodb', { request });

    await ddb.put(request).promise();

    logger.debug('returning', { thingToDo });

    return thingToDo;
};

export { createThingToDo };