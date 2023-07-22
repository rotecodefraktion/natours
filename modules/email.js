const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
  constructor(user, url, from) {
    this.to = `${user.name} <${user.email}>`;
    this.firstname = user.name.split(' ')[0];
    this.from =
      from === undefined
        ? `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`
        : from;
    this.url = url;
  }

  newTransport() {
    //console.log('process.env', process.env);
    let host = process.env.DEV_SMTP_HOST;
    let port = process.env.DEV_SMTP_PORT;
    let user = process.env.DEV_SMTP_USERNAME;
    let pass = process.env.DEV_SMTP_PASSWORD;
    let secureConnection = false;
    //console.log('host', host, ' port', port, ' user', user, ' pass', pass);

    if (process.env.NODE_ENV === 'production') {
      host = process.env.PROD_SMTP_HOST;
      port = process.env.PROT_SMTP_PORT;
      user = process.env.PROD_SMTP_USER;
      pass = process.env.PROD_SMTP_PASS;
      secureConnection = true;
      /* return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      }); */
    }
    return nodemailer.createTransport({
      host: host,
      port: port,
      secureConnection: secureConnection,
      auth: {
        user: user,
        pass: pass,
      },
    });
  }
  async send(template, subject) {
    //console.log('username', this.firstname);
    // 1. Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstname: this.firstname,
      url: this.url,
      subject,
    });

    // 2. Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };
    //('mailOptions', mailOptions.from);
    // 3. Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendwelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Password Reset for Natours Family!');
  }
};
