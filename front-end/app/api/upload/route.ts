//import { google } from '@ai-sdk/google'
//import { streamText, UIMessage, convertToModelMessages } from 'ai'
import { QdranSimpleService } from '@/lib/qdrant-simple'

export const maxDuration = 30;

export async function POST(req: Request) { 
    console.log('Processing chat request...');
    try {
        const url = new URL(req.url);
        let projectId = url.searchParams.get('projectId');
        projectId = '1' // For testing, hardcode projectId
        //const { messages }: { messages: UIMessage[] } = await req.json();

        //console.log('Received messages:', messages);
        console.log('Project ID:', projectId);
        // Get last user message for search
        //const lastMessage = messages[messages.length - 1];
        let contextFromDocs = '';
        
        //console.log('Last message:', lastMessage);
        // Search in project docs if projectId provided
        if (projectId && lastMessage?.role === 'user') {
        console.log(`Searching documents for project ${projectId}...`);
            try {
                const qdrantService = new QdranSimpleService();
                // Extract text from first part
                const firstPart = lastMessage.parts?.[0];
                const messageContent = firstPart?.type === 'text' ? (firstPart as any).text : '';
                const searchResults = await qdrantService.searchDocuments(projectId, messageContent, 3);
                
                if (searchResults.length > 0) {
                    contextFromDocs = `\n\nRelevant documentation:\n${searchResults.map(r => 
                        `- ${r.content} (from ${r.filePath})`
                    ).join('\n')}`;
                }
            } catch (error) {
                console.error('Search error:', error);
            }
        }
        /*
        const result = streamText({
            model: google('gemini-1.5-flash'),
            messages: convertToModelMessages(messages),
            system: `You are a helpful assistant. ${contextFromDocs ? `Use this documentation context when relevant: ${contextFromDocs}` : ''}`,
        });
    
        return result.toUIMessageStreamResponse();
        */
    } catch (error) {
        return new Response(
            JSON.stringify({ error: `Failed to process chat request: ${error}` }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

}