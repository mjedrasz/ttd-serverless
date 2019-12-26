import { esReindex } from './esReindex';
import wrapper from '@dazn/lambda-powertools-pattern-basic';
import { EnvironmentCredentials } from 'aws-sdk';
import { Client } from 'elasticsearch';
import awsHttpClient from 'http-aws-es';

const { ES_ENDPOINT, ES_INDEX, ES_REGION, INDEX_FN_NAME } = process.env;

const creds = new EnvironmentCredentials('AWS');

const es = Client({
    host: ES_ENDPOINT,
    connectionClass: awsHttpClient,
    amazonES: {
        region: ES_REGION,
        credentials: creds
    }
});

const limits = {
    maxRecords: Number.MAX_VALUE,  // No limit on number of records, we collapse them in a single value
    maxSize: 256 * 1024,           // Amazon Lambda invocation payload accepts up to 256KiB per message
    maxUnitSize: 256 * 1024,       // Amazon Lambda invocation payload accepts up to 256KiB per message
    listOverhead: 16 + 36,         // Records are put in a JSON object "{\\"Records\\":[]} + the message is eveloped in {"Records":[{"Sns":{"Message":""}}]} to mimic SNS message"
    recordOverhead: 0,             // Records are just serialized
    interRecordOverhead: 1         // Records are comma separated
};

const handler = wrapper(esReindex({
    es,
    index: ES_INDEX,
    limits,
    indexFn: INDEX_FN_NAME
}));

export { handler };


