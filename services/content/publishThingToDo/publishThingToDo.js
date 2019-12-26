import logger from '@dazn/lambda-powertools-logger';
import { PENDING, DRAFT } from '../lib/thingToDoStatuses';
import { THING_TODO, gsi1sk as rangeKey } from '../lib/entityTypes';


const publishThingToDo = ({ ddb, tableName }) => async (event) => {

    logger.debug('received', { event });

    const { ttdId, orgId } = event;

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
            ':new': rangeKey(PENDING, orgId),
            ':current': rangeKey(DRAFT, orgId),
            ':event': {
                type: 'TTD_PUBLISHED'
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
        logger.debug('error when publishing thing todo', { error: err });
        if (err.code === 'ConditionalCheckFailedException') {
            throw new Error('valid thing todo not found');
        }
        throw err;
    }
};

export { publishThingToDo };