/**
 * Ultra Simple API Example - 4 Lines
 *
 * The simplest possible SyntroJS API.
 */

import { SyntroJS } from 'syntrojs';

// Create API in 4 lines
const app = new SyntroJS({ title: 'Simple API' });
app.get('/hello', { handler: () => ({ message: 'Hello World!' }) });
app.listen(8080).then((address) => {
  console.log('\n🚀 Simple API');
  console.log(`Server running at ${address}\n`);
  console.log('📖 Interactive Documentation:');
  console.log(`   Swagger UI: ${address}/docs`);
  console.log(`   ReDoc:      ${address}/redoc\n`);
  console.log('🔗 Available Endpoints:');
  console.log(`   GET    ${address}/hello\n`);
  console.log('💡 Try this example:');
  console.log(`   curl ${address}/hello\n`);
});
