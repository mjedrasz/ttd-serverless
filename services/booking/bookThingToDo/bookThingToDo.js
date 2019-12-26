import logger from '@dazn/lambda-powertools-logger';
import { ACTIVE } from '../lib/bookingStatuses';
import { PUBLISHED } from '../lib/thingToDoStatuses';
import { BOOKING, THING_TODO, gsi1sk as rangeKey, gsi1skBooking as bookingKey } from '../lib/entityTypes';

const chance = require('chance').Chance();

const bookThingToDo = ({ ddb, tableName }) => async (event) => {

    const buildBooking = (userId, ttdId, date, peopleNo) => {
        const id = chance.guid();
        const gsi1sk = bookingKey(ACTIVE, userId, date, ttdId);
        return {
            id,
            sk: BOOKING,
            gsi1sk,
            peopleNo,
            __event__: {
                type: 'BKG_CREATED'
            }
        };
    };
    const validThingToDoFound = (thingToDo) => thingToDo && thingToDo.gsi1sk == rangeKey(PUBLISHED, thingToDo.orgId);

    logger.debug('received', { event });

    const { ttdId, date, userId, peopleNo } = event;

    const getRequest = {
        TableName: tableName,
        Key: {
            id: ttdId,
            sk: THING_TODO
        }
    };

    logger.debug('getting thing todo by id', { request: getRequest });

    const { Item: thingToDo } = await ddb.get(getRequest).promise();

    logger.debug('got thing todo', { thingToDo });

    if (validThingToDoFound(thingToDo)) {
        const booking = buildBooking(userId, ttdId, date, peopleNo);

        const putRequest = {
            Item: booking,
            TableName: tableName
        };

        logger.debug('putting booking in dynamodb', { request: putRequest });

        await ddb.put(putRequest).promise();

        const result = {
            ...booking,
            date
        };

        logger.debug('returning', { result });

        return result;

    } else {
        logger.error('valid thing todo not found', { ttdId });
        throw new Error('valid thing todo not found');
    }
};

export { bookThingToDo };