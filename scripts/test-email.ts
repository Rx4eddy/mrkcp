import dotenv from 'dotenv';
dotenv.config();

import emailService from '../src/server/services/email.service.js';

async function sendTestEmail() {
  const recipient = process.argv[2] || process.env.GMAIL_USER || process.env.TEST_EMAIL_RECIPIENT;

  if (!recipient) {
    console.error('Error: Please provide a recipient email address:');
    console.error('  npx tsx scripts/test-email.ts your-email@example.com');
    process.exit(1);
  }

  console.log(`Sending live test email to: ${recipient}...`);
  const success = await emailService.sendVerificationEmail(recipient, 'Competitive Programmer', 'test-token-123456');

  if (success) {
    console.log(`\n🎉 SUCCESS! Test email dispatched to ${recipient}. Please check your inbox / spam folder.`);
  } else {
    console.error('\n❌ FAILED to send email. Please check your credentials in .env.');
  }
}

sendTestEmail().catch(console.error);
