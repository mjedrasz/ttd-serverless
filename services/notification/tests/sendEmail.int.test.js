import { sendEmail } from '../sendEmail/sendEmail';
import AWS from 'aws-sdk';

const ses = new AWS.SES({
    region: 'us-east-1',
    endpoint: process.env.SES_ENDPOINT || 'http://localhost:4579'
});

const EMAIL_SOURCE = 'no-reply@hopnamiasto.pl';

describe('send email', () => {

    beforeEach(async () => {
        await ses.verifyEmailIdentity({ EmailAddress: EMAIL_SOURCE }).promise();
    });

    test('should send email', async () => {
        const deps = {
            ses,
            emailSource: EMAIL_SOURCE
        };

        const event = {
            Records: [{
                body: JSON.stringify(
                    {
                        to: ['email@example.com'],
                        data: {
                            body: 'my body1',
                            subject: 'my subject1'
                        },
                        template: 'template1'
                    })
            },
            {
                body: JSON.stringify(

                    {
                        to: ['rec1@example.com', 'rec2@test.com'],
                        data: {
                            body: 'my body2',
                            subject: 'my subject2'
                        },
                        template: 'template2'
                    })
            }]
        };

        const result = await sendEmail(deps)(event);

        expect(result).toHaveLength(2);

    });
});