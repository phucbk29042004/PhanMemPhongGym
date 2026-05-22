import { PayOS } from '@payos/node';

const payOS = new PayOS({
  clientId: 'fa35782c-6e2f-40d5-a9ca-5d478c0f1dd4',
  apiKey: 'd0e918a5-0265-4658-aded-c31b95070b38',
  checksumKey: 'df6877c2d608887722b9bad2a842b8c32352bc649de1fca3ac49269a4876e89e'
});

async function run() {
  try {
    const orderCode = Math.floor(Date.now() / 1000);
    const paymentData = {
      orderCode: orderCode,
      amount: 10000,
      description: 'Test purchase',
      cancelUrl: 'https://google.com',
      returnUrl: 'https://google.com'
    };
    console.log('Testing create with:', paymentData);
    const res = await payOS.paymentRequests.create(paymentData);
    console.log('Success:', res);
  } catch (err) {
    console.error('Error creating payment link:', err);
  }
}

run();
