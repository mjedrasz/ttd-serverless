import { contactUs } from '../contactUs/contactUs';
import SQS from 'aws-sdk/clients/sqs';

const sqs = new SQS({
    region: 'us-east-1',
    endpoint: process.env.SQS_ENDPOINT || 'http://localhost:4576'
});

const CONTACT_US_RECIPIENTS = ['test@test.com', 'example@test.com'];
const EMAIL_QUEUE = 'email-queue';
const EMAIL_QUEUE_URL = `http://localhost:4576/queue/${EMAIL_QUEUE}`
const USER_POOL_ID = 'user-pool-id-1';
const TEMPLATE_NAME = 'contactUs'

const cognitoIdp = {
    adminGetUser: jest.fn()
}

describe('contact us', () => {

    beforeEach(async () => {
        await sqs.createQueue({ QueueName: EMAIL_QUEUE }).promise();
    });

    afterEach(async () => {
        await sqs.deleteQueue({
            QueueUrl: EMAIL_QUEUE_URL
        }).promise();
    });

    test('should put contact us message on SQS', async () => {
        cognitoIdp.adminGetUser.mockImplementation(({
            UserPoolId,
            Username
        }) => ({
            promise: () => Promise.resolve({
                UserAttributes: [{
                    Name: 'email',
                    Value: 'user@email.com'
                }]
            })
        }));
        const deps = {
            sqs,
            userPoolId: USER_POOL_ID,
            cognitoIdp,
            recipients: CONTACT_US_RECIPIENTS,
            emailQueue: EMAIL_QUEUE,
            template: TEMPLATE_NAME
        };

        const event = {
            message: { from: 'myself', subject: 'no idea', body: 'howde' }, username: 'userid-1'
        };

        await contactUs(deps)(event);

        const response = await sqs.receiveMessage({ QueueUrl: EMAIL_QUEUE_URL }).promise();

        const message = JSON.parse(response.Messages[0].Body);

        expect(message).toEqual({
            to: CONTACT_US_RECIPIENTS,
            data: {
                body: event.message.body,
                subject: event.message.subject,
                from: event.message.from,
                sender: 'user@email.com',
            },
            template: TEMPLATE_NAME
        })

    });


    test('should send contact message for a guest', async () => {
        cognitoIdp.adminGetUser.mockImplementation(({
            UserPoolId,
            Username
        }) => ({
            promise: () => Promise.reject(new Error('UserNotFoundException'))
        }));
        const deps = {
            sqs,
            userPoolId: USER_POOL_ID,
            cognitoIdp,
            recipients: CONTACT_US_RECIPIENTS,
            emailQueue: EMAIL_QUEUE,
            template: TEMPLATE_NAME
        };

        const event = {
            message: { from: 'myself', subject: 'no idea', body: 'howde' }, username: 'userid-1'
        };

        await contactUs(deps)(event);

        const response = await sqs.receiveMessage({ QueueUrl: EMAIL_QUEUE_URL }).promise();

        const message = JSON.parse(response.Messages[0].Body);

        expect(message).toEqual({
            to: CONTACT_US_RECIPIENTS,
            data: {
                body: event.message.body,
                subject: event.message.subject,
                from: event.message.from,
                sender: 'guest',
            },
            template: TEMPLATE_NAME
        })

    });
});