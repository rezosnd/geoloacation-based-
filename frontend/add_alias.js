const axios = require('axios');

async function addAlias() {
  const original = process.argv[2];
  const corrected = process.argv[3];

  if (!original || !corrected) {
    console.log('Usage: node add_alias.js <wrong_name> <correct_name>');
    console.log('Example: node add_alias.js "zerry" "Jale"');
    return;
  }

  try {
    const res = await axios.post('http://localhost:3000/api/dictionary/alias', {
      originalName: original,
      correctedName: corrected
    });
    console.log('Success:', res.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

addAlias();
