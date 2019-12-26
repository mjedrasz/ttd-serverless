import { thingsToDoByIds } from './thingsToDoByIds';
import DynamoDB from '@dazn/lambda-powertools-dynamodb-client';
import wrapper from '@dazn/lambda-powertools-pattern-basic';

const { DYNAMODB_ONE_TABLE } = process.env;

const handler = wrapper(thingsToDoByIds({
    ddb: DynamoDB,
    tableName: DYNAMODB_ONE_TABLE
}));

export { handler };


