import logger from '@dazn/lambda-powertools-logger';

const contactUs = ({ sqs, emailQueue, template, recipients, cognitoIdp, userPoolId }) => async (event) => {

    logger.debug('received event', { event });

    const senderEmail = async (username, userPoolId) => {
        try {
            const request = {
                UserPoolId: userPoolId,
                Username: username
            };
            logger.debug('getting user', { request });

            const response = await cognitoIdp.adminGetUser(request).promise();

            logger.debug('got user', { response });

            const email = response.UserAttributes.filter(({ Name }) => Name === 'email')[0].Value;
            return email;
        } catch (error) {
            if (error.message === 'UserNotFoundException') {
                return 'guest';
            } else {
                logger.error('error when getting email address', { error: error.toString() });
                return username;
            }
        }
    };

    const { message: { from, subject, body }, username } = event;

    const getQueueUrlRequest = { QueueName: emailQueue };

    logger.debug('getting queue url', { request: getQueueUrlRequest });

    const response = await sqs.getQueueUrl(getQueueUrlRequest).promise();

    logger.debug('got queue url respones', { response });

    const sender = await senderEmail(username, userPoolId);

    const messageBody = {
        to: recipients,
        data: {
            body,
            sender,
            subject,
            from
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

export { contactUs };