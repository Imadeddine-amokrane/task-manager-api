const sgMail = require('@sendgrid/mail');

const sendGridAPIKey = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(sendGridAPIKey);

const sendWelcomeEmail = (email, name) => {
  const msg = {
    to: email,
    from: 'imad.amkrn08@gmail.com',
    subject: 'Welcome to task-app ',
    html: `<h1>Welcome</h1> <p>Welcome ${name}, we hope that you get the best out of our application</p>`,
    // text: `Welcome ${name}, we hope that you get the best out of our application`,
  };

  sgMail.send(msg);
};

const sendCancelationEmail = (email, name) => {
  const msg = {
    to: email,
    from: 'imad.amkrn08@gmail.com',
    subject: 'Thank you',
    html: '<h1>Thank you</h1>',
    text: `Hope you see you again ${name}`,
  };

  sgMail.send(msg);
};

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail,
};
