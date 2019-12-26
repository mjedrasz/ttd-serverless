import logger from '@dazn/lambda-powertools-logger';
import { DRAFT } from '../lib/thingToDoStatuses';
import { THING_TODO, gsi1sk as rangeKey } from '../lib/entityTypes';

const updateThingToDo = ({ ddb, tableName }) => async (event) => {

    const updateThingToDo = ({ existing, updated }) => {
        const thingTodo = {
            ...updated,
            id: existing.id,
            sk: existing.sk,
            gsi1sk: existing.gsi1sk,
            orgId: existing.orgId,
            image: updated.image || existing.image,
            __event__: {
                type: 'TTD_UPDATED'
            }
        };
        return thingTodo;
    };

    const validThingToDoFound = (thingToDo) => thingToDo && thingToDo.gsi1sk == rangeKey(DRAFT, orgId);

    logger.debug('received', { event });

    const { ttdId, orgId, thingToDo } = event;

    const getRequest = {
        TableName: tableName,
        Key: {
            id: ttdId,
            sk: THING_TODO
        }
    };

    logger.debug('getting thing todo by id', { request: getRequest });

    const { Item: existingThingToDo } = await ddb.get(getRequest).promise();

    if (validThingToDoFound(existingThingToDo, orgId)) {

        const updatedThingToDo = updateThingToDo({ existing: existingThingToDo, updated: thingToDo });

        const request = {
            Item: updatedThingToDo,
            ConditionExpression: 'attribute_exists(id)',
            TableName: tableName
        };

        logger.debug('putting in dynamodb', { request });

        await ddb.put(request).promise();

        logger.debug('returning', { updatedThingToDo });

        return updatedThingToDo;
    } else {
        logger.error('valid thing todo not found', { ttdId });
        throw new Error('valid thing todo not found');
    }
};

export { updateThingToDo };