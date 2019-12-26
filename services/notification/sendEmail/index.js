import { sendEmail } from './sendEmail';
import wrapper from '@dazn/lambda-powertools-pattern-basic';
import SES from 'aws-sdk/clients/ses';

const { EMAIL_SOURCE, SES_REGION } = process.env;

const ses = new SES({
    region: SES_REGION
});

const handler = wrapper(sendEmail({
    ses,
    emailSource: EMAIL_SOURCE
}));

export { handler };


