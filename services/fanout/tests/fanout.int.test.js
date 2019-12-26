import { fanout } from '../fanout/fanout';
import { PUBLISHED } from '../lib/thingToDoStatuses';
import { THING_TODO, gsi1sk as rangeKey } from '../lib/entityTypes';
import SNS from 'aws-sdk/clients/sns';

const sns = new SNS({
    region: 'us-east-1',
    endpoint: process.env.SNS_ENDPOINT || 'http://localhost:4575'
});

const FANOUT_TOPIC = 'fanout-topic';
const FANOUT_TOPIC_ARN = `arn:aws:sns:us-east-1:000000000000:${FANOUT_TOPIC}`;

describe('fanout', () => {

    beforeEach(async () => {
        await sns.createTopic({ Name: FANOUT_TOPIC }).promise();
    });

    afterEach(async () => {
        await sns.deleteTopic({
            TopicArn: FANOUT_TOPIC_ARN
        }).promise();
    });

    test('fanout', async () => {
        const deps = {
            sns,
            topic: FANOUT_TOPIC_ARN,
            limits: {
                maxRecords: Number.MAX_VALUE,  // No limit on number of records, we collapse them in a single value
                maxSize: 256 * 1024,             // Amazon SNS only accepts up to 256KiB per message
                maxUnitSize: 256 * 1024,         // Amazon SNS only accepts up to 256KiB per message
                listOverhead: 14,              // Records are put in a JSON object "{"Records":[]}"
                recordOverhead: 0,             // Records are just serialized
                interRecordOverhead: 1         // Records are comma separated
            }
        };

        const item1 = {
            ...require('./data/dynamoDbPlace.json'),
            id: { S: 'ttdid-1' },
            orgId: { S: 'orgid-1' },
            gsi1sk: { S: rangeKey(PUBLISHED, 'orgid-1') },
            __event__: {
                M: {
                    type: { S: 'TTD_PUBLISHED'}
                }
            }
        };

        const item2 = {
            ...require('./data/dynamoDbPlace.json'),
            id: { S: 'ttdid-2' },
            orgId: { S: 'orgid-1' },
            gsi1sk: { S: rangeKey(PUBLISHED, 'orgid-1') },
            __event__: {
                M: {
                    type: { S: 'TTD_PUBLISHED' }
                }
            }
        };

        const item3 = {
            ...require('./data/dynamoDbPlace.json'),
            id: { S: 'ttdid-3' },
            orgId: { S: 'orgid-2' },
            gsi1sk: { S: rangeKey(PUBLISHED, 'orgid-2') },
            __event__: {
                M: {
                    type: { S: 'TTD_PUBLISHED' }
                }
            }
        };

        const item4 = {
            ...require('./data/dynamoDbPlace.json'),
            id: { S: 'ttdid-4' },
            orgId: { S: 'orgid-2' },
            gsi1sk: { S: rangeKey(PUBLISHED, 'orgid-2') },
            __event__: {
                M: {
                    type: { S: 'TTD_DELETED' }
                }
            }
        };

        const records = [
            {
                eventID: 'ev-1',
                eventName: 'MODIFY',
                eventSource: 'aws:dynamodb',
                dynamodb: {
                    Keys: {
                        id: item1.id,
                        sk: THING_TODO
                    },
                    NewImage: item1,
                    OldImage: {},
                    SizeBytes: 1533
                }
            },
            {
                eventID: 'ev-2',
                eventName: 'MODIFY',
                eventSource: 'aws:dynamodb',
                dynamodb: {
                    Keys: {
                        id: item2.id,
                        sk: THING_TODO
                    },
                    NewImage: item2,
                    OldImage: {},
                    SizeBytes: 1533
                }
            },
            {
                eventID: 'ev-3',
                eventName: 'MODIFY',
                eventSource: 'aws:dynamodb',
                dynamodb: {
                    Keys: {
                        id: item3.id,
                        sk: THING_TODO
                    },
                    NewImage: item3,
                    OldImage: {},
                    SizeBytes: 1533
                }
            },
            {
                eventID: 'ev-4',
                eventName: 'MODIFY',
                eventSource: 'aws:dynamodb',
                dynamodb: {
                    Keys: {
                        id: item4.id,
                        sk: THING_TODO
                    },
                    NewImage: item4,
                    OldImage: {},
                    SizeBytes: 1533
                }
            }
        ];


        const event = {
            Records: records
        };

        const result = await fanout(deps)(event);

        expect(result).toHaveLength(2) //by event type

    });
});