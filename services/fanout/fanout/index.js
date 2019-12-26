import { fanout } from './fanout';
import wrapper from '@dazn/lambda-powertools-pattern-basic';
import SNS from '@dazn/lambda-powertools-sns-client';

const FANOUT_TOPIC = process.env.FANOUT_TOPIC;

const limits = {
    maxRecords: Number.MAX_VALUE,  // No limit on number of records, we collapse them in a single value
    maxSize: 256 * 1024,             // Amazon SNS only accepts up to 256KiB per message
    maxUnitSize: 256 * 1024,         // Amazon SNS only accepts up to 256KiB per message
    listOverhead: 14,              // Records are put in a JSON object "{"Records":[]}"
    recordOverhead: 0,             // Records are just serialized
    interRecordOverhead: 1         // Records are comma separated
};

const handler = wrapper(fanout({
    sns: SNS,
    topic: FANOUT_TOPIC,
    limits
}));

export { handler };


