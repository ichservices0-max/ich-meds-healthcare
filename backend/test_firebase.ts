import { bucket } from './src/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

async function test() {
  const fileName = `test/${uuidv4()}.txt`;
  const fileUpload = bucket.file(fileName);
  try {
    await fileUpload.save('Hello world', { metadata: { contentType: 'text/plain' } });
    console.log('Saved');
    await fileUpload.makePublic();
    console.log('Made public');
  } catch (err) {
    console.error('Failed:', err);
  }
}
test();
