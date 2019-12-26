import logger from '@dazn/lambda-powertools-logger';

const notifyUs = ({ sqs, emailQueue, template, recipients }) => async (event) => {

    logger.debug('received event', { event });

    const pending = JSON.parse(event.Records[0].Sns.Message).Records;

    const body = pending.reduce((acc, v) => {
        acc.push([v.id, v.name]);
        return acc;
    }, []);

    const getQueueUrlRequest = { QueueName: emailQueue };

    logger.debug('getting queue url', { request: getQueueUrlRequest });

    const response = await sqs.getQueueUrl(getQueueUrlRequest).promise();

    logger.debug('got queue url respones', { response });

    const messageBody = {
        to: recipients,
        data: {
            body: body.join('<br/>'),
            subject: 'Pending requests',
        },
        template
    };

    const request = {
        QueueUrl: response.QueueUrl,
        MessageBody: JSON.stringify(messageBody)

    };

    logger.debug('sending to sqs', { request });

    await sqs.sendMessage(request).promise();
};

export { notifyUs };