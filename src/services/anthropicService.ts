import{ Model, ModelsResponse, MessagesRequest, MessagesResponse, Usage, MessageStartEvent, MessageDeltaEvent, MessageStopEvent,ContentBlockStartEvent, ContentBlockDeltaEvent, ErrorResponse} from '../types/anthropic';

import { anthropicMockModels } from '../data/anthropicMockData';
import { getCurrentTimestamp, formatErrorResponse, calculateTokens, generateMessageId, findModelById, SSEMessageFormatter} from '../utils/anthropicHelpers';

/**
 * Get model list
 */
export function getModels(): ModelsResponse {
	const models: Model[] = anthropicMockModels.map((mockModel) => ({
		id: mockModel.id,
		type: "model",
		created_at: getCurrentTimestamp().toString(),
		display_name: mockModel.name
	}));

	return {  
		data: models,  
		first_id: models.length > 0 ? models[0].id : null,  
		last_id:  models.length > 0 ? models[models.length - 1].id : null,  
		has_more: false  
	}  
}
/**
 * Non-streaming response
 */
export function createMessage(request: MessagesRequest): MessagesResponse | ErrorResponse{
	//Validate Model
	const model = findModelById(request.model);
	if(!model){
		return formatErrorResponse(`Model '${request.model}' does not exist`);
	}

	// Get last user message
	const lastUserMessage = request.messages
		.slice()
		.reverse()
		.find((msg) => msg.role === "user");
	
	if(!lastUserMessage){
		return formatErrorResponse("No user message found");
	}

	// Select test case
	const testCase = model.testCases[0];
	const messageId = generateMessageId();
 
	let content = {
		type: "text",
		text: testCase.response
	};

	const inputTokens = calculateTokens(lastUserMessage.content || "");
	const outputTokens = calculateTokens(testCase.response || "");

	const stop_reason = "end_turn"
	const stop_sequence = null;
	const usage: Usage = {
		input_tokens: inputTokens,
		output_tokens: outputTokens,
		cache_creation: {
			ephemeral_1h_input_tokens: null,
			ephemeral_5m_input_tokens: null
		},
		cache_creation_input_tokens: null,
		cache_read_input_tokens: null,
		server_tool_use: null,
		service_tier: null
	};

	const response: MessagesResponse = {
		id: messageId,
		type: "message",
		role: "assistant",
		content: [content],
		model: request.model,
		stop_reason: stop_reason,
		stop_sequence: stop_sequence,
		usage: usage,
		container: null
	}
	return response;
}

/**
 * Streaming response
 */
export function* createMessageStream(request: MessagesRequest): Generator<string, void, unknown> {
	//validate model
	const model = findModelById(request.model);
	if(!model){
		const errorEvent = {	
			type: 'error',
			message: `Model '${request.model}' does not exist`
		}
		yield SSEMessageFormatter('error', errorEvent);
		return;
	}

	//get last user message
	const lastUserMessage = request.messages
		.slice()
		.reverse()
		.find((msg) => msg.role === "user");
	
	if(!lastUserMessage){
		const errorEvent = {	
			type: 'error',
			message: "No user message found"
		}
		yield SSEMessageFormatter('error', errorEvent);
		return;
	}

	const messageId = generateMessageId();
	let outputTokens = 0;


	const startChunk: MessageStartEvent = {
		type: 'message_start',
		message: {
			id: messageId,
			type: 'message',
			role: 'assistant',
			content: [],
			model: request.model,
			stop_reason: null,
			stop_sequence: null,
			usage: {
				input_tokens: 0,
				output_tokens: 0,
				cache_creation: {
					ephemeral_1h_input_tokens: null,
					ephemeral_5m_input_tokens: null
				},
				cache_creation_input_tokens: null,
				cache_read_input_tokens: null,
				server_tool_use: null,
				service_tier: null
			},
			container: null
		}
	}
	yield SSEMessageFormatter('message_start', startChunk);
	// Get test case
	const testCase = model.testCases[0];

	// Send the first chunk
	const firstChunk: ContentBlockStartEvent = {
		type: 'content_block_start',
		index: 0,
		content_block: {
			type: 'text',
			text: ""
		}
	}
	yield SSEMessageFormatter('content_block_start', firstChunk);

	//If there are predefined streaming chunks, use them
	if(testCase.streamChunks && testCase.streamChunks.length > 0){
		for(const chunk of testCase.streamChunks){
			outputTokens += calculateTokens(chunk);
			const streamChunk: ContentBlockDeltaEvent = {
				type: 'content_block_delta',
				index: 0,
				delta: {
					type: 'text_delta',
					text: chunk
				}
			}
			yield SSEMessageFormatter('content_block_delta', streamChunk);
		}
	} else{
		// Split the response into chunks
		const words = testCase.response.split(" ");
		for(let i = 0; i < words.length; i += 2){
			const chunkText = words.slice(i, i + 2).join(" ") + (i + 2 < words.length ? " " : "");
			outputTokens += calculateTokens(chunkText);
			const streamChunk: ContentBlockDeltaEvent = {
				type: 'content_block_delta',
				index: 0,
				delta: {
					type: 'text_delta',
					text: chunkText
				}
			}
			yield SSEMessageFormatter('content_block_delta', streamChunk);
		}
	}

	//send message delta
	const messageDelta: MessageDeltaEvent = {
		type: 'message_delta',
		delta: {
			stop_reason: 'end_turn',
			stop_sequence: null,
		},
		usage: {
			output_tokens: outputTokens
		}
	}
	yield SSEMessageFormatter('message_delta', messageDelta);

	//send message stop
	const messageStop: MessageStopEvent = {
		type: 'message_stop'
	}
	yield SSEMessageFormatter('message_stop', messageStop);
}