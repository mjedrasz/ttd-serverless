import { contactUs } from './contactUs';
import wrapper from '@dazn/lambda-powertools-pattern-basic';
import CognitoIdentityServiceProvider from 'aws-sdk/clients/cognitoidentityserviceprovider';
import SQS from '@dazn/lambda-powertools-sqs-client';

const cognitoIdp = new CognitoIdentityServiceProvider();

const {
    CONTACT_US_RECIPIENTS,
    USER_POOL_ID,
    EMAIL_QUEUE,
    TEMPLATE_NAME } = process.env;

const handler = wrapper(contactUs({
    sqs: SQS,
    userPoolId: USER_POOL_ID,
    cognitoIdp,
    recipients: CONTACT_US_RECIPIENTS.split(','),
    emailQueue: EMAIL_QUEUE,
    template: TEMPLATE_NAME
}));

export { handler };


