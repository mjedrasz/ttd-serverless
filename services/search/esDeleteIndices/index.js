import { esDeleteIndices } from './esDeleteIndices';
import wrapper from '@dazn/lambda-powertools-pattern-basic';
import { EnvironmentCredentials } from 'aws-sdk';
import { Client } from 'elasticsearch';
import awsHttpClient from 'http-aws-es';

const { ES_ENDPOINT, ES_INDICES, ES_REGION } = process.env;

const creds = new EnvironmentCredentials('AWS');

const es = Client({
    host: ES_ENDPOINT,
    connectionClass: awsHttpClient,
    amazonES: {
        region: ES_REGION,
        credentials: creds
    }
});

const handler = wrapper(esDeleteIndices({
    es,
    indices: ES_INDICES.split(',')
}));

export { handler };


