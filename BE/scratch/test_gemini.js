const apiKey = 'AIzaSyC7d_4gHJSEHHKBr4ygs2MYHiSDLaCsRiU';

const test = async (version, model) => {
  const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }]
      })
    });
    const status = res.status;
    const body = await res.json();
    if (res.ok) {
      console.log(`✅ SUCCESS: ${version} - ${model} (Status: ${status})`);
      return true;
    } else {
      console.log(`❌ FAILED: ${version} - ${model} (Status: ${status}, Message: ${body.error?.message})`);
      return false;
    }
  } catch (err) {
    console.log(`💥 ERROR: ${version} - ${model} (${err.message})`);
    return false;
  }
};

const run = async () => {
  console.log('Testing Gemini endpoints...');
  await test('v1', 'gemini-1.5-flash');
  await test('v1beta', 'gemini-1.5-flash');
  await test('v1', 'gemini-pro');
  await test('v1beta', 'gemini-pro');
  await test('v1', 'gemini-1.5-pro');
  await test('v1beta', 'gemini-1.5-pro');
};

run();
