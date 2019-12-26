import logger from '@dazn/lambda-powertools-logger';
import { ACTIVE } from '../lib/favoriteStatuses';
import { skFavorite } from '../lib/entityTypes';

const areFavoritesByIds = ({ ddb, tableName }) => async (events) => {

    logger.debug('received', { events });

    const ids = events.map(({ source: { id }}) => id);

    const userId = events[0].userId;

    const uniqueKeys = [...new Set(ids)].map(id => ({ id, sk: skFavorite(userId) }));

    const request = {
        RequestItems: {
            [tableName]: {
                Keys: uniqueKeys
            }
        }
    };

    logger.debug('batch get from Dynamodb', { request });

    const response = await ddb.batchGet(request).promise();

    logger.debug('DynamoDB response', { response });

    const areMyFavoritesByIds = response.Responses[tableName].reduce((acc, v) => {
        acc[v.id] = v.gsi1sk === ACTIVE;
        return acc;
    }, new Map());

    const result = ids.map(id => areMyFavoritesByIds[id] || false);

    logger.debug('returning', { result });

    return result;
};

export { areFavoritesByIds };