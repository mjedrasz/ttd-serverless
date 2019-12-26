import { esIndex } from './esIndex';
import DynamoDB from '@dazn/lambda-powertools-dynamodb-client';
import wrapper from '@dazn/lambda-powertools-pattern-basic';
import { EnvironmentCredentials } from 'aws-sdk';
import { Client } from 'elasticsearch';
import awsHttpClient from 'http-aws-es';

const { ES_ENDPOINT, ES_INDEX, ES_REGION, DYNAMODB_ONE_TABLE } = process.env;

const creds = new EnvironmentCredentials('AWS');

const es = Client({
    host: ES_ENDPOINT,
    connectionClass: awsHttpClient,
    amazonES: {
        region: ES_REGION,
        credentials: creds
    }
});

const handler = wrapper(esIndex({
    ddb: DynamoDB,
    tableName: DYNAMODB_ONE_TABLE,
    es,
    index: ES_INDEX
}));

export { handler };


