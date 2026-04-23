const axios = require('axios');

async function test() {
    try {
        const id = '69e9eda854b6bf8ace2d46c4';
        const res = await axios.get(`http://localhost:5000/api/departments/${id}`);
        console.log('SUCCESS:', res.data);
    } catch (err) {
        console.error('ERROR:', err.response ? err.response.status : err.message);
        console.error('BODY:', err.response ? err.response.data : 'No body');
    }
}

test();
