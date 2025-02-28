/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { Client as ElasticClient } from '@elastic/elasticsearch';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConversationRole,
} from '@aws-sdk/client-bedrock-runtime';
import { ConfigService } from '@nestjs/config';

const NGO_INDEX = 'socialserviceagencies';
const VOLUNTEER_INDEX = 'volunteer';
@Injectable()
export class AppService {
  private elasticClient;
  private awsBedrockClient;

  constructor(private configService: ConfigService) {
    this.elasticClient = new ElasticClient({
      node: this.configService.get('ELASTIC_NODE') as string, // Elasticsearch endpoint
      auth: {
        apiKey: this.configService.get('ELASTIC_API_KEY') as string,
      },
    });

    this.awsBedrockClient = new BedrockRuntimeClient({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') as string,
        secretAccessKey: this.configService.get(
          'AWS_SECRET_ACCESS_KEY',
        ) as string,
        sessionToken: this.configService.get('AWS_SESSION_TOKEN') as string,
      },
    });
  }

  async getVolunteerByName(text) {
    const esSearch = await this.elasticClient.search({
      index: VOLUNTEER_INDEX,
      query: {
        match: {
          Full_Name: text,
        },
      },
    });
    console.log('volunteer esSearch', esSearch);
    const { _source } = esSearch.hits.hits[0];

    return { data: _source };
  }

  async getNgoByName(text) {
    const esSearch = await this.elasticClient.search({
      index: NGO_INDEX,
      query: {
        match: {
          Name: text,
        },
      },
    });
    console.log('ngo esSearch', esSearch);
    const { _source } = esSearch.hits.hits[0];

    return { data: _source };
  }

  async connectToBedrock() {
    console.log(process.env.AWS_REGION);
    const modelId = 'anthropic.claude-3-5-sonnet-20241022-v2:0';

    // Start a conversation with the user message.
    const userMessage =
      "Describe the purpose of a 'hello world' program in one line.";
    const conversation = [
      {
        role: ConversationRole.USER,
        content: [{ text: userMessage }],
      },
    ];

    // Create a command with the model ID, the message, and a basic configuration.
    const command = new ConverseCommand({
      modelId,
      messages: conversation,
      inferenceConfig: { maxTokens: 512, temperature: 0.5, topP: 0.9 },
    });

    try {
      // Send the command to the model and wait for the response
      const response = await this.awsBedrockClient.send(command);

      // Extract and print the response text.
      const responseText = response.output.message.content[0].text;
      console.log(responseText);
    } catch (err) {
      console.log(`ERROR: Can't invoke '${modelId}'. Reason: ${err}`);
      process.exit(1);
    }
  }
}
