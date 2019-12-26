import logger from '@dazn/lambda-powertools-logger';
import { ACTIVE } from '../lib/favoriteStatuses';
import { PUBLISHED } from '../lib/thingToDoStatuses';
import { THING_TODO, gsi1sk as rangeKey, skFavorite } from '../lib/entityTypes';

const addToMyFavorites = ({ ddb, tableName }) => async (event) => {

    const buildFavorite = (userId, id) => {
        const sk = skFavorite(userId);
        return {
            id,
            sk,
            gsi1sk: ACTIVE,
            __event__: {
                type: 'FAV_ADDED'
            }
        };
    };

    const validThingToDoFound = (thingToDo) => thingToDo && thingToDo.gsi1sk == rangeKey(PUBLISHED, thingToDo.orgId);

    logger.debug('received', { event });

    const { ttdId, userId } = event;

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
        const favorite = buildFavorite(userId, ttdId);

        const putRequest = {
            Item: favorite,
            TableName: tableName
        };

        logger.debug('putting favorite in dynamodb', { request: putRequest });

        await ddb.put(putRequest).promise();

        const result = {
            ...favorite
        };

        logger.debug('returning', { result });

        return result;

    } else {
        logger.error('valid thing todo not found', { ttdId });
        throw new Error('valid thing todo not found');
    }
};

export { addToMyFavorites };