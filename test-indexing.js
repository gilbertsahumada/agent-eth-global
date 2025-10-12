const path = require('path');

async function testIndexing() {
    const filePath = path.join(__dirname, 'front-end/public/vrf.md');

    console.log('Testing indexing with file:', filePath);
    console.log('Sending request to: http://localhost:3000/api/projects');

    try {
        const response = await fetch('http://localhost:3000/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filePath: filePath
            })
        });

        const data = await response.json();

        console.log('\nResponse Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (response.ok) {
            console.log('\n✅ Indexing successful!');
        } else {
            console.log('\n❌ Indexing failed');
        }
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

testIndexing();
