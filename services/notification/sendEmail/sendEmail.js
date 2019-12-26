import logger from '@dazn/lambda-powertools-logger';

const sendEmail = ({ ses, emailSource }) => async (event) => {

    logger.debug('received event', { event });

    const requests = event.Records.map(({ body }) => JSON.parse(body)).map(({ to, data, template }) => ({
        Destination: {
            ToAddresses: [...to]
        },
        Template: template,
        TemplateData: JSON.stringify(data),
        Source: emailSource
    }));

    logger.debug('sending to SES', { requests });

    const result = await Promise.all(requests.map(request => ses.sendTemplatedEmail(request).promise()));

    logger.debug('sent summary', { result });

    return result;
};

export { sendEmail };