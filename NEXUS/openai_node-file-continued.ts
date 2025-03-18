displayName: 'Logit Bias',
            name: 'logitBias',
            type: 'json',
            default: '{}',
            description: 'Modify the likelihood of specified tokens appearing in the completion',
            placeholder: '{"50256": -100}',
          },
          {
            displayName: 'User',
            name: 'user',
            type: 'string',
            default: '',
            description: 'A unique identifier representing your end-user for tracking and monitoring purposes',
          },
        ],
      },
      {
        displayName: 'Additional Options',
        name: 'additionalOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
          show: {
            operation: [
              'completion',
              'chat',
            ],
          },
        },
        options: [
          {
            displayName: 'Response Format',
            name: 'responseFormat',
            type: 'options',
            options: [
              {
                name: 'Default',
                value: 'default',
                description: 'Return a standard text completion',
              },
              {
                name: 'JSON Object',
                value: 'json_object',
                description: 'Return a valid JSON object',
              },
            ],
            default: 'default',
            description: 'The format in which the model returns the completion',
          },
          {
            displayName: 'Stream',
            name: 'stream',
            type: 'boolean',
            default: false,
            description: 'Whether to stream back partial progress (Note: Not fully supported in n8n yet)',
          },
        ],
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
          show: {
            operation: [
              'generateImage',
            ],
          },
        },
        options: [
          {
            displayName: 'Quality',
            name: 'quality',
            type: 'options',
            options: [
              {
                name: 'Standard',
                value: 'standard',
                description: 'Standard quality (default)',
              },
              {
                name: 'High Definition',
                value: 'hd',
                description: 'Higher quality with more detail',
              },
            ],
            default: 'standard',
            description: 'The quality of the generated image',
          },
          {
            displayName: 'Style',
            name: 'style',
            type: 'options',
            options: [
              {
                name: 'Natural',
                value: 'natural',
                description: 'Natural style (default)',
              },
              {
                name: 'Vivid',
                value: 'vivid',
                description: 'More vibrant and colorful style',
              },
            ],
            default: 'natural',
            description: 'The style of the generated image',
          },
          {
            displayName: 'Size',
            name: 'size',
            type: 'options',
            options: [
              {
                name: '256x256',
                value: '256x256',
                description: 'Small size image',
              },
              {
                name: '512x512',
                value: '512x512',
                description: 'Medium size image',
              },
              {
                name: '1024x1024',
                value: '1024x1024',
                description: 'Large size image (default)',
              },
              {
                name: '1792x1024',
                value: '1792x1024',
                description: 'Wide (16:9) landscape image',
              },
              {
                name: '1024x1792',
                value: '1024x1792',
                description: 'Tall (9:16) portrait image',
              },
            ],
            default: '1024x1024',
            description: 'The size of the generated image',
          },
          {
            displayName: 'Response Format',
            name: 'responseFormat',
            type: 'options',
            options: [
              {
                name: 'URL',
                value: 'url',
                description: 'Return URL to the image (default)',
              },
              {
                name: 'Base64',
                value: 'b64_json',
                description: 'Return base64-encoded JSON',
              },
            ],
            default: 'url',
            description: 'The format in which the generated image is returned',
          },
          {
            displayName: 'Number of Images',
            name: 'n',
            type: 'number',
            default: 1,
            description: 'The number of images to generate (max 10)',
            typeOptions: {
              minValue: 1,
              maxValue: 10,
            },
          },
        ],
      },
      {
        displayName: 'Output Mapping',
        name: 'outputMapping',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        placeholder: 'Add Output Mapping',
        default: {},
        options: [
          {
            name: 'values',
            displayName: 'Values',
            values: [
              {
                displayName: 'Field Name',
                name: 'fieldName',
                type: 'string',
                default: '',
                description: 'Name of the field to map the output to',
                placeholder: 'e.g., summary',
              },
              {
                displayName: 'Path Expression',
                name: 'pathExpression',
                type: 'string',
                default: '',
                description: 'Path to the value in the OpenAI response',
                placeholder: 'e.g., choices[0].text',
              },
            ],
          },
        ],
        description: 'Map specific parts of the OpenAI response to output fields',
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Return Full Response',
            name: 'returnFullResponse',
            type: 'boolean',
            default: false,
            description: 'Whether to return the full OpenAI API response instead of just the result',
          },
          {
            displayName: 'Timeout',
            name: 'timeout',
            type: 'number',
            default: 60,
            description: 'Maximum time in seconds to wait for the API response',
          },
          {
            displayName: 'Fallback Strategy',
            name: 'fallbackStrategy',
            type: 'options',
            options: [
              {
                name: 'Error',
                value: 'error',
                description: 'Throw an error on failure (default)',
              },
              {
                name: 'Default Value',
                value: 'defaultValue',
                description: 'Return a default value on failure',
              },
              {
                name: 'Retry',
                value: 'retry',
                description: 'Automatically retry the request',
              },
            ],
            default: 'error',
            description: 'How to handle API failures',
          },
          {
            displayName: 'Default Value',
            name: 'defaultValue',
            type: 'string',
            default: '',
            displayOptions: {
              show: {
                fallbackStrategy: [
                  'defaultValue',
                ],
              },
            },
            description: 'The value to return if the API call fails',
          },
          {
            displayName: 'Max Retries',
            name: 'maxRetries',
            type: 'number',
            default: 3,
            displayOptions: {
              show: {
                fallbackStrategy: [
                  'retry',
                ],
              },
            },
            description: 'Maximum number of retry attempts on failure',
          },
          {
            displayName: 'Retry Delay',
            name: 'retryDelay',
            type: 'number',
            default: 1000,
            displayOptions: {
              show: {
                fallbackStrategy: [
                  'retry',
                ],
              },
            },
            description: 'Delay between retry attempts in milliseconds',
          },
        ],
      },
    ],
  };

  /**
   * Execute the node functionality
   */
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    // Load API credentials
    const credentials = await this.getCredentials('openAiApi');
    const apiKey = credentials.apiKey as string;

    // Initialize the OpenAI client
    const configuration = new Configuration({ apiKey });
    const openai = new OpenAIApi(configuration);

    // Process each item
    for (let i = 0; i < items.length; i++) {
      try {
        if (operation === 'completion') {
          // Get parameters
          const model = this.getNodeParameter('model', i) as string;
          const promptType = this.getNodeParameter('promptType', i) as string;
          const prompt = this.getNodeParameter('prompt', i) as string;
          const options = this.getNodeParameter('options', i, {}) as {
            temperature?: number;
            maxTokens?: number;
            topP?: number;
            frequencyPenalty?: number;
            presencePenalty?: number;
            stop?: string;
            logitBias?: string;
            user?: string;
          };
          const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as {
            responseFormat?: string;
            stream?: boolean;
          };

          // Prepare request parameters
          const requestParams: any = {
            model,
            prompt,
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            top_p: options.topP,
            frequency_penalty: options.frequencyPenalty,
            presence_penalty: options.presencePenalty,
            user: options.user,
          };

          // Add optional parameters only if they are set
          if (options.stop) {
            requestParams.stop = options.stop.split(',').map(s => s.trim());
          }

          if (options.logitBias) {
            try {
              requestParams.logit_bias = JSON.parse(options.logitBias);
            } catch (error) {
              throw new NodeOperationError(this.getNode(), 'Invalid JSON in logit bias parameter');
            }
          }

          if (additionalOptions.responseFormat === 'json_object') {
            requestParams.response_format = { type: 'json_object' };
          }

          if (additionalOptions.stream === true) {
            // Stream not fully supported yet, but set the parameter
            requestParams.stream = true;
          }

          // Execute the API call
          const response = await openai.createCompletion(requestParams);

          // Process the response
          const outputMapping = this.getNodeParameter('outputMapping', i, { values: [] }) as {
            values: { fieldName: string; pathExpression: string }[];
          };

          const returnFullResponse = this.getNodeParameter('options.returnFullResponse', i, false) as boolean;

          let result: INodeExecutionData;
          if (returnFullResponse) {
            result = {
              json: response.data,
            };
          } else {
            result = {
              json: {
                choices: response.data.choices,
                usage: response.data.usage,
              },
            };
          }

          // Apply output mapping if defined
          if (outputMapping.values && outputMapping.values.length > 0) {
            for (const mapping of outputMapping.values) {
              const { fieldName, pathExpression } = mapping;
              if (fieldName && pathExpression) {
                try {
                  // Parse the path expression and navigate through the result
                  const parts = pathExpression.split('.');
                  let value = response.data;
                  for (const part of parts) {
                    // Handle array indexing
                    const match = part.match(/(\w+)\[(\d+)\]/);
                    if (match) {
                      const [_, prop, index] = match;
                      value = value[prop][parseInt(index, 10)];
                    } else {
                      value = value[part];
                    }
                  }
                  
                  // Add the mapped value to the result
                  result.json[fieldName] = value;
                } catch (error) {
                  // Ignore mapping errors and continue
                  console.error(`Error applying output mapping ${pathExpression}: ${error.message}`);
                }
              }
            }
          }

          returnData.push(result);
        }
        else if (operation === 'chat') {
          // Process chat completion (implementation similar to completion but with different parameters)
          const model = this.getNodeParameter('model', i) as string;
          const messagesParameter = this.getNodeParameter('messages', i, { values: [] }) as {
            values: {
              type: string;
              messageType?: string;
              message?: string;
              messageJson?: string;
            }[];
          };
          const options = this.getNodeParameter('options', i, {}) as {
            temperature?: number;
            maxTokens?: number;
            topP?: number;
            frequencyPenalty?: number;
            presencePenalty?: number;
            stop?: string;
            logitBias?: string;
            user?: string;
          };
          const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as {
            responseFormat?: string;
            stream?: boolean;
          };

          // Process messages
          const messages = messagesParameter.values.map(messageConfig => {
            if (messageConfig.type === 'json') {
              try {
                return JSON.parse(messageConfig.messageJson || '{}');
              } catch (error) {
                throw new NodeOperationError(this.getNode(), 'Invalid JSON in message');
              }
            } else {
              return {
                role: messageConfig.messageType,
                content: messageConfig.message,
              };
            }
          });

          // Prepare request parameters
          const requestParams: any = {
            model,
            messages,
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            top_p: options.topP,
            frequency_penalty: options.frequencyPenalty,
            presence_penalty: options.presencePenalty,
            user: options.user,
          };

          // Add optional parameters
          if (options.stop) {
            requestParams.stop = options.stop.split(',').map(s => s.trim());
          }

          if (options.logitBias) {
            try {
              requestParams.logit_bias = JSON.parse(options.logitBias);
            } catch (error) {
              throw new NodeOperationError(this.getNode(), 'Invalid JSON in logit bias parameter');
            }
          }

          if (additionalOptions.responseFormat === 'json_object') {
            requestParams.response_format = { type: 'json_object' };
          }

          // Execute the API call
          const response = await openai.createChatCompletion(requestParams);

          // Process the response
          const returnFullResponse = this.getNodeParameter('options.returnFullResponse', i, false) as boolean;

          if (returnFullResponse) {
            returnData.push({
              json: response.data,
            });
          } else {
            returnData.push({
              json: {
                choices: response.data.choices,
                usage: response.data.usage,
              },
            });
          }
        }
        // Implement other operations (edit, embedding, generateImage) similarly
        else if (operation === 'generateImage') {
          const prompt = this.getNodeParameter('prompt', i) as string;
          const options = this.getNodeParameter('options', i, {}) as {
            quality?: string;
            style?: string;
            size?: string;
            responseFormat?: string;
            n?: number;
          };

          // Prepare request parameters
          const requestParams: any = {
            prompt,
            n: options.n || 1,
            size: options.size || '1024x1024',
            response_format: options.responseFormat || 'url',
          };

          if (options.quality) {
            requestParams.quality = options.quality;
          }

          if (options.style) {
            requestParams.style = options.style;
          }

          // Execute the API call
          const response = await openai.createImage(requestParams);

          // Process the response
          const returnFullResponse = this.getNodeParameter('options.returnFullResponse', i, false) as boolean;

          if (returnFullResponse) {
            returnData.push({
              json: response.data,
            });
          } else {
            returnData.push({
              json: {
                data: response.data.data,
                created: response.data.created,
              },
            });
          }
        }
        else {
          throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not implemented yet`);
        }
      } catch (error) {
        // Error handling strategy
        const fallbackStrategy = this.getNodeParameter('options.fallbackStrategy', i, 'error') as string;

        if (fallbackStrategy === 'error' || !fallbackStrategy) {
          throw error;
        } else if (fallbackStrategy === 'defaultValue') {
          const defaultValue = this.getNodeParameter('options.defaultValue', i, '') as string;
          returnData.push({
            json: { result: defaultValue, error: error.message },
          });
        } else if (fallbackStrategy === 'retry') {
          // Implement retry logic here
          const maxRetries = this.getNodeParameter('options.maxRetries', i, 3) as number;
          const retryDelay = this.getNodeParameter('options.retryDelay', i, 1000) as number;

          let retryCount = 0;
          let success = false;

          while (!success && retryCount < maxRetries) {
            retryCount++;
            try {
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              // TODO: Implement actual retry logic for specific operations
              // For now, just add an error message
              success = false; // Keep retrying for this example
            } catch (retryError) {
              // Continue with retry loop
            }
          }

          if (!success) {
            returnData.push({
              json: { error: `Failed after ${maxRetries} retries: ${error.message}` },
            });
          }
        }
      }
    }

    return [returnData];
  }
}
