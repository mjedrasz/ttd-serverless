import logger from '@dazn/lambda-powertools-logger';
import { USER } from '../lib/entityTypes';

const organisersByIds = ({ ddb, tableName }) => async (events) => {

    logger.debug('received', { events });

    const ids = events.map(({ source: { orgId }}) => orgId);

    const uniqueKeys = [...new Set(ids)].map(id => ({ id, sk: USER }));

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

    const organisersByIds = response.Responses[tableName].reduce((acc, v) => {
        acc[v.id] = v;
        return acc;
    }, new Map());

    const result = ids.map(id => organisersByIds[id] || null);

    logger.debug('returning', { result });

    return result;
};

export { organisersByIds };