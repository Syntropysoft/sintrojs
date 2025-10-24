import { SyntroJS } from 'syntrojs';

const app = new SyntroJS();

app.get('/hello', {
  handler: () => ({ message: 'Hello World!' }),
});

await app.listen(3001);
