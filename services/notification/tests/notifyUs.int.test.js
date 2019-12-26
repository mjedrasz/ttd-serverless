import { notifyUs } from '../notifyUs/notifyUs';
import SQS from 'aws-sdk/clients/sqs';

const sqs = new SQS({
    region: 'us-east-1',
    endpoint: process.env.SQS_ENDPOINT || 'http://localhost:4576'
});

const CONTACT_US_RECIPIENTS = ['test@test.com', 'example@test.com'];
const EMAIL_QUEUE = 'email-queue';
const EMAIL_QUEUE_URL = `http://localhost:4576/queue/${EMAIL_QUEUE}`
const TEMPLATE_NAME = 'notifyUs'

describe('notify us', () => {

    beforeEach(async () => {
        await sqs.createQueue({ QueueName: EMAIL_QUEUE }).promise();
    });

    afterEach(async () => {
        await sqs.deleteQueue({
            QueueUrl: EMAIL_QUEUE_URL
        }).promise();
    });

    test('should put notify us message on SQS', async () => {
        const deps = {
            sqs,
            recipients: CONTACT_US_RECIPIENTS,
            emailQueue: EMAIL_QUEUE,
            template: TEMPLATE_NAME
        };

        const event = {
            Records: [{
                Sns: {
                    Message: JSON.stringify({
                        Records: [{ id: '1', name: 'name1' }, { id: '2', name: 'name2' }]
                    })
                }
            }]
        };

        await notifyUs(deps)(event);

        const response = await sqs.receiveMessage({ QueueUrl: EMAIL_QUEUE_URL }).promise();
        const message = JSON.parse(response.Messages[0].Body);
        expect(message).toEqual({
            to: CONTACT_US_RECIPIENTS,
            data: {
                body: '1,name1<br/>2,name2',
                subject: 'Pending requests',
            },
            template: TEMPLATE_NAME
        })

    });
});