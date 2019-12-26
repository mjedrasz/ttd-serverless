import logger from '@dazn/lambda-powertools-logger';
import { blockify, groupBy } from '../lib/ops';
import AWS from 'aws-sdk';

const fanout = ({ sns, topic, limits }) => async (event) => {

    logger.debug('received event', { event });

    const dynamoDbToJavascript = (event) => {
        return event.Records.map(record => {
            const json = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage || {});
            const buffer = Buffer.from(JSON.stringify(json), 'utf-8');
            return {
                data: json,
                size: buffer.length
            };
        });
    };

    const toMessageAttributes = event => {
        return Object.keys(event).reduce((acc, key) => {
            acc[key] = {
                DataType: 'String',
                StringValue: `${event[key]}`
            };
            return acc;
        }, {});
    };

    const transformed = dynamoDbToJavascript(event);

    logger.debug('transformed from dynamodb to javascript/json format', { transformed });

    const grouped = groupBy(transformed, record => JSON.stringify(record.data.__event__));

    const requests = Array.from(grouped)
        .filter(([key, _]) => key !== undefined)
        .map(([key, value]) => (
            {
                attributes: toMessageAttributes(JSON.parse(key)),
                blocks: blockify(value, limits)
            }))
        .flatMap(message => message.blocks.map(block => (
            {
                TopicArn: topic,
                Message: JSON.stringify({ Records: block.map(record => record.data) }),
                MessageAttributes: message.attributes
            }
        )));

    logger.debug('sending to sns', { requests });

    const response = await Promise.all(requests.map(request => sns.publish(request).promise()));

    logger.debug('response from sns', { response });

    return response;
};

export { fanout };