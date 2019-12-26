import logger from '@dazn/lambda-powertools-logger';
import { USER } from '../lib/entityTypes';

const initProfile = ({ ddb, tableName }) => async (event) => {

    const buildProfile = (event) => {
        const id = event.request.userAttributes.sub;
        const sk = USER;
        const name = event.request.userAttributes.name || null;
        return {
            id,
            sk,
            name
        };
    };

    logger.debug('received', { event });

    const profile = buildProfile(event);

    const request = { TableName: tableName, Item: profile };

    logger.debug('putting in DynamoDB', { request });

    await ddb.put(request).promise();

    logger.debug('returning', { event });

    return event;
};

export { initProfile };


