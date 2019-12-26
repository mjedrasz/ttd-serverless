import { notifyUs } from './notifyUs';
import wrapper from '@dazn/lambda-powertools-pattern-basic';
import SQS from '@dazn/lambda-powertools-sqs-client';

const {
    CONTACT_US_RECIPIENTS,
    EMAIL_QUEUE,
    TEMPLATE_NAME } = process.env;

const handler = wrapper(notifyUs({
    sqs: SQS,
    recipients: CONTACT_US_RECIPIENTS.split(','),
    emailQueue: EMAIL_QUEUE,
    template: TEMPLATE_NAME
}));

export { handler };


