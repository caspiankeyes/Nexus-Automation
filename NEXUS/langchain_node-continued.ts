typeOptions: {
          rows: 4,
        },
      },
      {
        displayName: 'Output Format',
        name: 'outputFormat',
        type: 'options',
        displayOptions: {
          show: {
            operation: [
              'extractStructured',
              'classification',
            ],
          },
        },
        options: [
          {
            name: 'JSON',
            value: 'json',
            description: 'Return data as a JSON object',
          },
          {
            name: 'Simple Text',
            value: 'text',
            description: 'Return data as simple text',
          },
        ],
        default: 'json',
        description: 'The format of the extraction output',
      },
      
      // Summarization Configuration
      {
        displayName: 'Document',
        name: 'document',
        type: 'string',
        displayOptions: {
          show: {
            operation: [
              'summarization',
            ],
          },
        },
        default: '',
        placeholder: 'Enter the text to summarize',
        description: 'The text to generate a summary for',
        typeOptions: {
          rows: 4,
        },
        required: true,
      },
      {
        displayName: 'Summary Type',
        name: 'summaryType',
        type: 'options',
        displayOptions: {
          show: {
            operation: [
              'summarization',
            ],
          },
        },
        options: [
          {
            name: 'Concise',
            value: 'concise',
            description: 'A brief summary of the key points',
          },
          {
            name: 'Bullet Points',
            value: 'bulletPoints',
            description: 'Key points as bullet points',
          },
          {
            name: 'Detailed',
            value: 'detailed',
            description: 'A comprehensive summary',
          },
        ],
        default: 'concise',
        description: 'The type of summary to generate',
      },
      {
        displayName: 'Max Length',
        name: 'maxLength',
        type: 'number',
        displayOptions: {
          show: {
            operation: [
              'summarization',
            ],
          },
        },
        default: 200,
        description: 'Maximum length of the summary in words',
        typeOptions: {
          minValue: 50,
        },
      },
      
      // Web Scraping Configuration
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        displayOptions: {
          show: {
            operation: [
              'webScraping',
            ],
          },
        },
        default: '',
        placeholder: 'https://example.com',
        description: 'The URL to scrape information from',
        required: true,
      },
      {
        displayName: 'Extraction Query',
        name: 'extractionQuery',
        type: 'string',
        displayOptions: {
          show: {
            operation: [
              'webScraping',
            ],
          },
        },
        default: '',
        placeholder: 'Extract the main article content and key facts',
        description: 'What information to extract from the website',
        typeOptions: {
          rows: 4,
        },
        required: true,
      },
      
      // Advanced Options
      {
        displayName: 'Advanced Options',
        name: 'advancedOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Max Tokens',
            name: 'maxTokens',
            type: 'number',
            default: 1024,
            description: 'The maximum number of tokens to generate',
            typeOptions: {
              minValue: 1,
            },
          },
          {
            displayName: 'Top P',
            name: 'topP',
            type: 'number',
            default: 1,
            description: 'Controls diversity via nucleus sampling',
            typeOptions: {
              minValue: 0,
              maxValue: 1,
              stepSize: 0.1,
            },
          },
          {
            displayName: 'Frequency Penalty',
            name: 'frequencyPenalty',
            type: 'number',
            default: 0,
            description: 'Penalizes frequent tokens',
            typeOptions: {
              minValue: -2,
              maxValue: 2,
              stepSize: 0.1,
            },
          },
          {
            displayName: 'Presence Penalty',
            name: 'presencePenalty',
            type: 'number',
            default: 0,
            description: 'Penalizes new tokens based on if they appear in the text so far',
            typeOptions: {
              minValue: -2,
              maxValue: 2,
              stepSize: 0.1,
            },
          },
          {
            displayName: 'Chunk Size',
            name: 'chunkSize',
            type: 'number',
            default: 1000,
            description: 'Size of chunks when splitting text for document operations',
            typeOptions: {
              minValue: 100,
            },
          },
          {
            displayName: 'Chunk Overlap',
            name: 'chunkOverlap',
            type: 'number',
            default: 200,
            description: 'Overlap between chunks when splitting text',
            typeOptions: {
              minValue: 0,
            },
          },
          {
            displayName: 'Return Full Response',
            name: 'returnFullResponse',
            type: 'boolean',
            default: false,
            description: 'Whether to return the full LangChain response or just the result',
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

    // Get API credentials
    const credentials = await this.getCredentials('openAiApi');
    const apiKey = credentials.apiKey as string;

    // Process each item
    for (let i = 0; i < items.length; i++) {
      try {
        if (operation === 'simpleChain') {
          // Get parameters
          const model = this.getNodeParameter('model', i) as string;
          const temperature = this.getNodeParameter('temperature', i) as number;
          const promptTemplate = this.getNodeParameter('promptTemplate', i) as string;
          const inputVariablesParam = this.getNodeParameter('inputVariables', i, { variables: [] }) as {
            variables: { name: string; value: string }[];
          };
          const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as {
            maxTokens?: number;
            topP?: number;
            frequencyPenalty?: number;
            presencePenalty?: number;
            returnFullResponse?: boolean;
          };

          // Configure model
          const llm = new OpenAI({
            openAIApiKey: apiKey,
            modelName: model,
            temperature,
            maxTokens: advancedOptions.maxTokens,
            topP: advancedOptions.topP,
            frequencyPenalty: advancedOptions.frequencyPenalty,
            presencePenalty: advancedOptions.presencePenalty,
          });

          // Prepare input variables
          const inputVariables: Record<string, string> = {};
          for (const variable of inputVariablesParam.variables) {
            inputVariables[variable.name] = variable.value;
          }

          // Extract variable names from the template
          const variableNames = [...promptTemplate.matchAll(/{([^}]+)}/g)]
            .map(match => match[1].trim())
            .filter((value, index, self) => self.indexOf(value) === index);

          // Create prompt template
          const prompt = new PromptTemplate({
            template: promptTemplate,
            inputVariables: variableNames,
          });

          // Create chain
          const chain = new LLMChain({ llm, prompt });

          // Execute chain
          const response = await chain.call(inputVariables);

          // Process the response
          if (advancedOptions.returnFullResponse) {
            returnData.push({
              json: response,
            });
          } else {
            returnData.push({
              json: {
                result: response.text || '',
              },
            });
          }
        }
        else if (operation === 'extractStructured') {
          // Get parameters
          const model = this.getNodeParameter('model', i) as string;
          const temperature = this.getNodeParameter('temperature', i) as number;
          const document = this.getNodeParameter('document', i) as string;
          const schema = this.getNodeParameter('schema', i) as string;
          const extractionPrompt = this.getNodeParameter('extractionPrompt', i, '') as string;
          const outputFormat = this.getNodeParameter('outputFormat', i) as string;
          const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as {
            maxTokens?: number;
            returnFullResponse?: boolean;
          };

          // Parse schema
          let parsedSchema;
          try {
            parsedSchema = JSON.parse(schema);
          } catch (error) {
            throw new NodeOperationError(this.getNode(), 'Invalid JSON schema');
          }

          // Configure model
          const llm = new ChatOpenAI({
            openAIApiKey: apiKey,
            modelName: model,
            temperature,
            maxTokens: advancedOptions.maxTokens,
          });

          // Create Zod schema from JSON schema
          const createZodSchema = (schema: any): z.ZodType => {
            if (typeof schema === 'string') {
              switch (schema.toLowerCase()) {
                case 'string':
                  return z.string();
                case 'number':
                  return z.number();
                case 'boolean':
                  return z.boolean();
                default:
                  return z.string();
              }
            } else if (Array.isArray(schema)) {
              // Handle array of a single type
              if (schema.length === 1) {
                return z.array(createZodSchema(schema[0]));
              }
              // Handle array with mixed types (simplification)
              return z.array(z.any());
            } else if (typeof schema === 'object') {
              // Handle object type
              const shape: Record<string, z.ZodType> = {};
              for (const [key, value] of Object.entries(schema)) {
                shape[key] = createZodSchema(value);
              }
              return z.object(shape);
            }
            // Default fallback
            return z.any();
          };

          const zodSchema = createZodSchema(parsedSchema);
          const parser = StructuredOutputParser.fromZodSchema(zodSchema);

          // Create prompt with extracted format instructions
          let promptText;
          if (extractionPrompt) {
            promptText = `${extractionPrompt}\n\n${parser.getFormatInstructions()}\n\nText: ${document}`;
          } else {
            promptText = `Extract the following information from the text according to this schema:\n\n${parser.getFormatInstructions()}\n\nText: ${document}`;
          }

          const promptTemplate = PromptTemplate.fromTemplate(promptText);
          
          // Create and execute chain
          const chain = new LLMChain({
            llm,
            prompt: promptTemplate,
            outputParser: parser,
          });

          const response = await chain.call({});

          // Process the response
          if (advancedOptions.returnFullResponse) {
            returnData.push({
              json: {
                result: response.text,
                structuredOutput: response,
              },
            });
          } else {
            if (outputFormat === 'json') {
              returnData.push({
                json: {
                  result: response,
                },
              });
            } else {
              // For text output, convert back to string
              let textOutput = '';
              try {
                textOutput = JSON.stringify(response, null, 2);
              } catch (e) {
                textOutput = String(response);
              }
              returnData.push({
                json: {
                  result: textOutput,
                },
              });
            }
          }
        }
        else if (operation === 'classification') {
          // Get parameters
          const model = this.getNodeParameter('model', i) as string;
          const temperature = this.getNodeParameter('temperature', i) as number;
          const document = this.getNodeParameter('document', i) as string;
          const classesInput = this.getNodeParameter('classes', i) as string;
          const outputFormat = this.getNodeParameter('outputFormat', i) as string;
          const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as {
            maxTokens?: number;
            returnFullResponse?: boolean;
          };

          // Parse classes
          const classes = classesInput.split(',').map(c => c.trim());

          // Configure model
          const llm = new ChatOpenAI({
            openAIApiKey: apiKey,
            modelName: model,
            temperature,
            maxTokens: advancedOptions.maxTokens,
          });

          // Create prompt
          const promptTemplate = PromptTemplate.fromTemplate(
            `Classify the following text into one of these categories: ${classes.join(', ')}.\n\nText: {text}\n\nProvide your answer as a JSON object with "category" (the selected category), "confidence" (a score from 0-1), and "reasoning" (brief explanation).`
          );

          // Create chain
          const chain = new LLMChain({
            llm,
            prompt: promptTemplate,
          });

          // Execute chain
          const response = await chain.call({
            text: document,
          });

          // Parse response
          let result;
          try {
            // Try parsing as JSON
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              result = JSON.parse(jsonMatch[0]);
            } else {
              // Fallback: extract class directly
              const classResult = classes.find(c => response.text.includes(c));
              result = {
                category: classResult || 'Unknown',
                confidence: 0.5,
                reasoning: response.text,
              };
            }
          } catch (error) {
            // Fallback to basic extraction if JSON parsing fails
            const classResult = classes.find(c => response.text.includes(c));
            result = {
              category: classResult || 'Unknown',
              confidence: 0.5,
              reasoning: response.text,
            };
          }

          // Process the response
          if (advancedOptions.returnFullResponse) {
            returnData.push({
              json: {
                rawResponse: response.text,
                result,
              },
            });
          } else {
            if (outputFormat === 'json') {
              returnData.push({
                json: result,
              });
            } else {
              returnData.push({
                json: {
                  result: result.category,
                },
              });
            }
          }
        }
        else if (operation === 'summarization') {
          // Get parameters
          const model = this.getNodeParameter('model', i) as string;
          const temperature = this.getNodeParameter('temperature', i) as number;
          const document = this.getNodeParameter('document', i) as string;
          const summaryType = this.getNodeParameter('summaryType', i) as string;
          const maxLength = this.getNodeParameter('maxLength', i) as number;
          const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as {
            maxTokens?: number;
            returnFullResponse?: boolean;
          };

          // Configure model
          const llm = new ChatOpenAI({
            openAIApiKey: apiKey,
            modelName: model,
            temperature,
            maxTokens: advancedOptions.maxTokens,
          });

          // Create prompt based on summary type
          let promptTemplate;
          switch (summaryType) {
            case 'concise':
              promptTemplate = PromptTemplate.fromTemplate(
                `Summarize the following text in a concise manner, focusing on the key points. Keep the summary under ${maxLength} words.\n\nText: {text}\n\nConcise summary:`
              );
              break;
            case 'bulletPoints':
              promptTemplate = PromptTemplate.fromTemplate(
                `Extract the key points from the following text as a bullet point list. Include no more than ${Math.ceil(maxLength / 20)} bullet points.\n\nText: {text}\n\nKey points:`
              );
              break;
            case 'detailed':
              promptTemplate = PromptTemplate.fromTemplate(
                `Provide a detailed summary of the following text, covering all important aspects while staying under ${maxLength} words.\n\nText: {text}\n\nDetailed summary:`
              );
              break;
            default:
              promptTemplate = PromptTemplate.fromTemplate(
                `Summarize the following text. Keep the summary under ${maxLength} words.\n\nText: {text}\n\nSummary:`
              );
          }

          // Create chain
          const chain = new LLMChain({
            llm,
            prompt: promptTemplate,
          });

          // Execute chain
          const response = await chain.call({
            text: document,
          });

          // Process the response
          if (advancedOptions.returnFullResponse) {
            returnData.push({
              json: response,
            });
          } else {
            returnData.push({
              json: {
                summary: response.text,
                summaryType,
              },
            });
          }
        }
        else if (operation === 'webScraping') {
          // Get parameters
          const model = this.getNodeParameter('model', i) as string;
          const temperature = this.getNodeParameter('temperature', i) as number;
          const url = this.getNodeParameter('url', i) as string;
          const extractionQuery = this.getNodeParameter('extractionQuery', i) as string;
          const advancedOptions = this.getNodeParameter('advancedOptions', i, {}) as {
            maxTokens?: number;
            returnFullResponse?: boolean;
          };

          // Configure model
          const llm = new ChatOpenAI({
            openAIApiKey: apiKey,
            modelName: model,
            temperature,
            maxTokens: advancedOptions.maxTokens,
          });

          // Load webpage
          const loader = new CheerioWebBaseLoader(url);
          const docs = await loader.load();

          // Split text
          const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: advancedOptions.chunkSize || 1000,
            chunkOverlap: advancedOptions.chunkOverlap || 200,
          });
          const splitDocuments = await textSplitter.splitDocuments(docs);

          // Create vector store
          const vectorStore = await HNSWLib.fromDocuments(
            splitDocuments,
            new OpenAIEmbeddings({ openAIApiKey: apiKey })
          );

          // Create retrieval chain
          const chain = RetrievalQAChain.fromLLM(llm, vectorStore.asRetriever());

          // Execute chain
          const response = await chain.call({
            query: extractionQuery,
          });

          // Process the response
          if (advancedOptions.returnFullResponse) {
            returnData.push({
              json: {
                ...response,
                url,
                extractionQuery,
              },
            });
          } else {
            returnData.push({
              json: {
                result: response.text,
                url,
                extractionQuery,
              },
            });
          }
        }
        else {
          throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not implemented yet`);
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
            },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
