const bcrypt = require('bcryptjs');
const dbHash = '$2a$10$vWErzg2d64l1TrCk2XgL5.D8em0sCgBhaIImWCc.MDVaz7i74ZzMa';
bcrypt.compare('password123', dbHash)
  .then(res => console.log('Match?', res))
  .catch(console.error);
