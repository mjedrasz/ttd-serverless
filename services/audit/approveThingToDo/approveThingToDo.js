import logger from '@dazn/lambda-powertools-logger';
import { PENDING, PUBLISHED, DELETED } from '../lib/thingToDoStatuses';
import { THING_TODO, gsi1sk as rangeKey } from '../lib/entityTypes';

const approveThingToDo = ({ ddb, tableName }) => async (event) => {

    const validThingToDoFound = (thingToDo) => thingToDo && thingToDo.gsi1sk == rangeKey(PENDING, thingToDo.orgId);

    logger.debug('received', { event });

    const { ttdId } = event;

    const getRequest = {
        TableName: tableName,
        Key: {
            id: ttdId,
            sk: THING_TODO
        }
    };

    logger.debug('getting thing todo by id', { request: getRequest });

    const { Item: thingToDo } = await ddb.get(getRequest).promise();

    if (validThingToDoFound(thingToDo)) {
        const id = thingToDo.ttdId || ttdId;
        const orgId = thingToDo.orgId;

        const putRequest = {
            Item: {
                ...thingToDo,
                id,
                gsi1sk: rangeKey(PUBLISHED, orgId),
                __event__: {
                    type: 'TTD_APPROVED'
                }
            },
            TableName: tableName
        };
        try {
            const transactions = [{ Put: putRequest }];
            const isNewVersion = ttdId !== id;

            if (isNewVersion) {
                const deleteRequest = {
                    Key: {
                        id: ttdId,
                        sk: THING_TODO
                    },
                    ExpressionAttributeNames: {
                        '#event': '__event__'
                    },
                    ExpressionAttributeValues: {
                        ':new': rangeKey(DELETED, orgId),
                        ':current': rangeKey(PENDING, orgId),
                        ':event': {
                            type: 'TTD_DELETED'
                        }
                    },
                    ConditionExpression: 'gsi1sk = :current',
                    UpdateExpression: 'SET gsi1sk = :new, #event = :event',
                    TableName: tableName
                };

                transactions.push({
                    Update: deleteRequest
                });
            }

            const request = {
                TransactItems: transactions
            };

            logger.debug('updating thing todo in dynamodb', { request });

            await ddb.transactWrite(request).promise();

            const result = {
                ...thingToDo,
                id,
                gsi1sk: rangeKey(PUBLISHED, orgId)
            };

            logger.debug('returning', { result });

            return result;

        } catch (err) {
            logger.error('approve operation failed', { error: err.toString() });
            throw new Error('approve operation failed', err);
        }
    } else {
        logger.error('valid thing todo not found', { ttdId });
        throw new Error('valid thing todo not found');
    }
};

export { approveThingToDo };