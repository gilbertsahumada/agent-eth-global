const PORT = 3001;

async function testSearch() {
    const projectId = "1";
    const searchText = "How do I generate random numbers in smart contracts?";

    console.log('🔍 Testing search endpoint...');
    console.log('Project ID:', projectId);
    console.log('Search Query:', searchText);
    console.log(`\nSending request to: http://localhost:${PORT}/api/docs?projectId=${projectId}&searchText=${encodeURIComponent(searchText)}`);
    console.log('---\n');

    try {
        const url = `http://localhost:${PORT}/api/docs?projectId=${projectId}&searchText=${encodeURIComponent(searchText)}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        console.log('Response Status:', response.status);
        console.log('\n📊 Results:\n');

        if (response.ok && data.results) {
            console.log(`Found ${data.results.length} results:\n`);

            data.results.forEach((result, index) => {
                console.log(`\n--- Result ${index + 1} ---`);
                console.log('Score:', result.score);
                console.log('File:', result.filePath);
                console.log('Chunk Index:', result.chunkIndex);
                console.log('Content Preview:', result.content.substring(0, 200) + '...');
                if (result.metadata) {
                    console.log('Metadata:', JSON.stringify(result.metadata, null, 2));
                }
            });

            console.log('\n✅ Search successful!');
        } else {
            console.log('Response Data:', JSON.stringify(data, null, 2));
            console.log('\n❌ Search failed or no results');
        }
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

testSearch();
