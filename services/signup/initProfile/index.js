import { initProfile } from './initProfile';
import DynamoDB from '@dazn/lambda-powertools-dynamodb-client';
import wrapper from '@dazn/lambda-powertools-pattern-basic';

const { DYNAMODB_ONE_TABLE, ORG_USER_POOL_ID } = process.env;

const handler = wrapper(initProfile({
    ddb: DynamoDB,
    tableName: DYNAMODB_ONE_TABLE,
    userPoolId: ORG_USER_POOL_ID
}));

export { handler };


