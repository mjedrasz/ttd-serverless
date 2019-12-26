import logger from '@dazn/lambda-powertools-logger';
import { PENDING, REJECTED } from '../lib/thingToDoStatuses';
import { THING_TODO, gsi1sk as rangeKey } from '../lib/entityTypes';

const rejectThingToDo = ({ ddb, tableName }) => async (event) => {

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

        const { orgId } = thingToDo;

        const request = {
            TableName: tableName,
            Key: {
                id: ttdId,
                sk: THING_TODO
            },
            ExpressionAttributeNames: {
                '#event': '__event__'
            },
            ExpressionAttributeValues: {
                ':new': rangeKey(REJECTED, orgId),
                ':current': rangeKey(PENDING, orgId),
                ':event': {
                    type: 'TTD_REJECTED'
                }
            },
            ConditionExpression: 'gsi1sk = :current',
            UpdateExpression: 'SET gsi1sk = :new, #event = :event',
            ReturnValues: 'ALL_NEW'
        };

        logger.debug('updating in DynamoDB', { request });

        try {

            const { Attributes: thingToDo } = await ddb.update(request).promise();

            logger.debug('returing', { thingToDo });

            return thingToDo;
        } catch (err) {
            logger.debug('error when rejecting thing todo', { error: err });
            if (err.code === 'ConditionalCheckFailedException') {
                throw new Error('valid thing todo not found');
            }
            throw err;
        }

    } else {
        logger.error('valid thing todo not found', { ttdId });
        throw new Error('valid thing todo not found');
    }
};

export { rejectThingToDo };