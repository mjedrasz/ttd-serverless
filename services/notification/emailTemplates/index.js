module.exports = [{
    name: 'contactUs',
    subject: '{{subject}}',
    html: `<html>
    <head></head>
    <body>
      <h1>Contact us</h1>
      <p>from: {{from}}/{{sender}}</p>
      <p>{{body}}</p>
    </body>
    </html>
    `,
    text: 'From: {{from}}, Message: {{body}}',
},
{
    name: 'notifyUs',
    subject: '{{subject}}',
    html: `<html>
    <head></head>
    <body>
      <h1>Notify us</h1>
      <p>from: {{from}}/{{sender}}</p>
      <p>{{body}}</p>
    </body>
    </html>
    `,
    text: 'From: {{from}}/{{sender}}, Message: {{body}}',
}];