import { esSetup } from './esSetup';
import wrapper from '@dazn/lambda-powertools-pattern-basic';
import { EnvironmentCredentials } from 'aws-sdk';
import { Client } from 'elasticsearch';
import awsHttpClient from 'http-aws-es';

const { ES_ENDPOINT, ES_REGION, ES_INDEX, ES_SETUP_FILE } = process.env;

const config = require(`./${ES_SETUP_FILE}`);

const creds = new EnvironmentCredentials('AWS');

const es = Client({
    host: ES_ENDPOINT,
    connectionClass: awsHttpClient,
    amazonES: {
        region: ES_REGION,
        credentials: creds
    }
});

const handler = wrapper(esSetup({
    es,
    index: ES_INDEX,
    config
}));

export { handler };


