const testChrome = require('./test-chrome');
const testFirefox = require('./test-firefox');

async function runAllTests() {
  console.log('Running CaptionClip extension tests...\n');
  
  console.log('1. Testing Chrome extension...');
  const chromeSuccess = await testChrome();
  
  console.log('\n2. Testing Firefox extension...');
  const firefoxSuccess = await testFirefox();
  
  console.log('\n' + '='.repeat(50));
  console.log('Test Results:');
  console.log(`Chrome:  ${chromeSuccess ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(`Firefox: ${firefoxSuccess ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('='.repeat(50));
  
  const allPassed = chromeSuccess && firefoxSuccess;
  
  if (allPassed) {
    console.log('\n✓ All tests passed!');
  } else {
    console.log('\n✗ Some tests failed!');
  }
  
  return allPassed;
}

if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = runAllTests;