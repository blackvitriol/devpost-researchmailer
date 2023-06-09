import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import * as cheerio from 'cheerio';
import * as axios from 'axios';

admin.initializeApp();

// Configure your email transport using Nodemailer
const transporter = nodemailer.createTransport({
  // Replace with your SMTP server details
  service: 'Gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password',
  },
});

// Define your Cloud Function
export const sendWeeklyEmail = functions.pubsub
  .schedule('every week')
  .onRun(async (context) => {
    try {
      // Fetch user data from Firestore
      const usersSnapshot = await admin.firestore().collection('users').get();

      // Iterate through each user
      usersSnapshot.forEach(async (userDoc) => {
        const userData = userDoc.data();
        const userEmail = userData.email;
        const userQuery = userData.query;

        // Scrape Google Scholar for links and titles of research papers based on user data
        const searchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(
          userQuery
        )}&scisbd=1`;

        const response = await axios.default.get(searchUrl);
        const $ = cheerio.load(response.data);

        const researchPapers: { title: string; link: string }[] = [];

        // Extract title and link of each research paper
        $('.gs_rt a').each((_, element) => {
          const title = $(element).text();
          const link = $(element).attr('href');
          if (title && link) {
            researchPapers.push({ title, link });
          }
        });

        // Compose email message with research papers
        let emailBody = 'This is your weekly email!\n\nHere are some research papers:\n\n';

        researchPapers.forEach((paper) => {
          emailBody += `${paper.title}\n${paper.link}\n\n`;
        });

        const mailOptions = {
          from: 'your-email@gmail.com',
          to: userEmail,
          subject: 'Weekly Email',
          text: emailBody,
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
          } else {
            console.log('Email sent:', info.response);
          }
        });
      });

      return null;
    } catch (error) {
      console.error('Error sending weekly email:', error);
      return null;
    }
  });