import logger from '@dazn/lambda-powertools-logger';
import { THING_TODO } from '../lib/entityTypes';

const thingsToDoByIds = ({ ddb, tableName }) => async (events) => {

    logger.debug('received', { events });

    const ids = events.map(({ source: { id }}) => id);

    const uniqueKeys = [...new Set(ids)].map(id => ({ id, sk: THING_TODO }));

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

    const thingsToDoByIds = response.Responses[tableName].reduce((acc, v) => {
        acc[v.id] = v;
        return acc;
    }, new Map());

    const result = ids.map(id => thingsToDoByIds[id] || null);

    logger.debug('returning', { result });

    return result;
};

export { thingsToDoByIds };