/**
   * Scrape a table from a page
   */
  private async scrapeTable(page: Page, itemIndex: number): Promise<any> {
    const tableSelector = this.getNodeParameter('tableSelector', itemIndex) as string;
    const extractHeadersFrom = this.getNodeParameter('extractHeadersFrom', itemIndex) as string;
    const rowSelector = this.getNodeParameter('rowSelector', itemIndex, 'tbody tr') as string;
    const cellSelector = this.getNodeParameter('cellSelector', itemIndex, 'td') as string;

    // Get HTML content of the table
    const tableHtml = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      return element ? element.outerHTML : '';
    }, tableSelector);

    // Use Cheerio to parse the table
    const $ = cheerio.load(tableHtml);
    const table = $(tableSelector);
    
    // Process headers
    let headers: string[] = [];
    
    if (extractHeadersFrom === 'firstRow') {
      // Extract from first row (thead or first tr)
      const headerRow = table.find('thead tr').first().length 
        ? table.find('thead tr').first() 
        : table.find('tr').first();
        
      headers = headerRow.find('th, td').map((_, el) => {
        return $(el).text().trim();
      }).get();
    } else if (extractHeadersFrom === 'customSelectors') {
      // Extract from custom selectors
      const headerSelectors = this.getNodeParameter('headerSelectors', itemIndex, 'th, thead td') as string;
      headers = table.find(headerSelectors).map((_, el) => {
        return $(el).text().trim();
      }).get();
    } else if (extractHeadersFrom === 'manualHeaders') {
      // Use manually defined headers
      const manualHeaders = this.getNodeParameter('manualHeaders', itemIndex, { headers: [] }) as {
        headers: { name: string }[];
      };
      headers = manualHeaders.headers.map(header => header.name);
    } else {
      // Generate default column headers (column1, column2, etc.)
      const firstRow = table.find(rowSelector).first();
      const columnCount = firstRow.find(cellSelector).length;
      headers = Array.from({ length: columnCount }, (_, i) => `column${i + 1}`);
    }
    
    // Extract rows
    const rows: any[] = [];
    
    table.find(rowSelector).each((rowIndex, row) => {
      const rowData: any = {};
      
      $(row).find(cellSelector).each((cellIndex, cell) => {
        if (cellIndex < headers.length) {
          rowData[headers[cellIndex]] = $(cell).text().trim();
        }
      });
      
      // Only add non-empty rows
      if (Object.keys(rowData).length > 0) {
        rows.push(rowData);
      }
    });
    
    return {
      data: rows,
      headers,
      rowCount: rows.length,
    };
  }

  /**
   * Take a screenshot of a page or element
   */
  private async takeScreenshot(page: Page, itemIndex: number): Promise<any> {
    const fullPage = this.getNodeParameter('fullPage', itemIndex, true) as boolean;
    const outputFormat = this.getNodeParameter('outputFormat', itemIndex, 'png') as string;
    const quality = this.getNodeParameter('quality', itemIndex, 80) as number;
    
    let screenshotOptions: any = {
      type: outputFormat,
      fullPage,
    };
    
    // Add quality option for JPEG and WebP
    if (outputFormat === 'jpeg' || outputFormat === 'webp') {
      screenshotOptions.quality = quality;
    }
    
    // Take screenshot of specific element if selector provided
    if (!fullPage) {
      const elementSelector = this.getNodeParameter('elementSelector', itemIndex, '') as string;
      
      if (elementSelector) {
        try {
          // Wait for the element to be present
          await page.waitForSelector(elementSelector, { timeout: 5000 });
          
          // Get the element
          const element = await page.$(elementSelector);
          
          if (element) {
            // Take screenshot of the element
            const screenshotBuffer = await element.screenshot(screenshotOptions);
            
            // Return the screenshot as binary data
            const binaryProperty = 'screenshot';
            const fileName = `screenshot-${Date.now()}.${outputFormat}`;
            
            return {
              binary: {
                [binaryProperty]: await this.prepareBinaryData(
                  screenshotBuffer,
                  fileName,
                  `image/${outputFormat}`
                ),
              },
              data: {
                success: true,
                targetElement: elementSelector,
              },
            };
          }
        } catch (error) {
          return {
            data: {
              success: false,
              error: `Failed to screenshot element: ${error.message}`,
            },
          };
        }
      }
    }
    
    // Take screenshot of full page or viewport
    const screenshotBuffer = await page.screenshot(screenshotOptions);
    
    // Return the screenshot as binary data
    const binaryProperty = 'screenshot';
    const fileName = `screenshot-${Date.now()}.${outputFormat}`;
    
    return {
      binary: {
        [binaryProperty]: await this.prepareBinaryData(
          screenshotBuffer,
          fileName,
          `image/${outputFormat}`
        ),
      },
      data: {
        success: true,
        fullPage,
      },
    };
  }

  /**
   * Generate a PDF from a page
   */
  private async generatePdf(page: Page, itemIndex: number): Promise<any> {
    const pdfOptions = this.getNodeParameter('pdfOptions', itemIndex, {}) as {
      format?: string;
      landscape?: boolean;
      displayHeaderFooter?: boolean;
      headerTemplate?: string;
      footerTemplate?: string;
      printBackground?: boolean;
      scale?: number;
    };
    
    // Convert options to the format expected by Puppeteer
    const puppeteerPdfOptions: any = {
      format: pdfOptions.format || 'A4',
      landscape: pdfOptions.landscape || false,
      printBackground: pdfOptions.printBackground !== false,
      displayHeaderFooter: pdfOptions.displayHeaderFooter || false,
      scale: pdfOptions.scale || 1,
    };
    
    // Add header and footer templates if needed
    if (pdfOptions.displayHeaderFooter) {
      if (pdfOptions.headerTemplate) {
        puppeteerPdfOptions.headerTemplate = pdfOptions.headerTemplate;
      }
      
      if (pdfOptions.footerTemplate) {
        puppeteerPdfOptions.footerTemplate = pdfOptions.footerTemplate;
      }
    }
    
    // Generate PDF
    const pdfBuffer = await page.pdf(puppeteerPdfOptions);
    
    // Return the PDF as binary data
    const binaryProperty = 'pdf';
    const fileName = `webpage-${Date.now()}.pdf`;
    
    return {
      binary: {
        [binaryProperty]: await this.prepareBinaryData(
          pdfBuffer,
          fileName,
          'application/pdf'
        ),
      },
      data: {
        success: true,
        options: puppeteerPdfOptions,
      },
    };
  }

  /**
   * Scrape data across multiple paginated pages
   */
  private async scrapePagination(page: Page, itemIndex: number): Promise<any> {
    const paginationSelector = this.getNodeParameter('paginationSelector', itemIndex) as string;
    const maxPages = this.getNodeParameter('maxPages', itemIndex, 5) as number;
    const dataSelectors = this.getNodeParameter('dataSelectors', itemIndex, { values: [] }) as {
      values: {
        fieldName: string;
        selector: string;
        extractionType: 'text' | 'html' | 'attribute';
        attributeName?: string;
        itemSelector?: string;
      }[];
    };
    
    const allData: any[] = [];
    let currentPage = 1;
    
    while (currentPage <= maxPages) {
      // Extract data from current page
      console.log(`Scraping page ${currentPage}/${maxPages}`);
      
      // For each data selector
      const pageData: any[] = [];
      
      for (const selectorConfig of dataSelectors.values) {
        const { fieldName, selector, extractionType, attributeName, itemSelector } = selectorConfig;
        
        // If item selector is provided, extract data from each item
        if (itemSelector) {
          const items = await page.evaluate(
            (itemSelector, selector, extractionType, attributeName) => {
              const itemElements = Array.from(document.querySelectorAll(itemSelector));
              
              return itemElements.map(itemElement => {
                const result: any = { _pageNumber: currentPage };
                
                // Query the selector within this item
                const element = itemElement.querySelector(selector);
                
                if (element) {
                  if (extractionType === 'text') {
                    result[fieldName] = element.textContent?.trim() || '';
                  } else if (extractionType === 'html') {
                    result[fieldName] = element.innerHTML || '';
                  } else if (extractionType === 'attribute' && attributeName) {
                    result[fieldName] = element.getAttribute(attributeName) || '';
                  }
                } else {
                  result[fieldName] = null;
                }
                
                return result;
              });
            },
            itemSelector,
            selector,
            extractionType,
            attributeName
          );
          
          pageData.push(...items);
        } else {
          // Extract data directly from the page
          const data = await page.evaluate(
            (selector, extractionType, attributeName) => {
              const elements = Array.from(document.querySelectorAll(selector));
              const result: any = { _pageNumber: currentPage };
              
              if (elements.length > 0) {
                const values = elements.map(element => {
                  if (extractionType === 'text') {
                    return element.textContent?.trim() || '';
                  } else if (extractionType === 'html') {
                    return element.innerHTML || '';
                  } else if (extractionType === 'attribute' && attributeName) {
                    return element.getAttribute(attributeName) || '';
                  }
                  return '';
                });
                
                result[fieldName] = values;
              } else {
                result[fieldName] = null;
              }
              
              return result;
            },
            selector,
            extractionType,
            attributeName
          );
          
          pageData.push(data);
        }
      }
      
      // Merge data from current page
      allData.push(...pageData);
      
      // Check if there's a next page
      const hasNextPage = await page.evaluate((selector) => {
        const nextButton = document.querySelector(selector);
        return nextButton !== null && !nextButton.hasAttribute('disabled');
      }, paginationSelector);
      
      if (!hasNextPage || currentPage >= maxPages) {
        break;
      }
      
      // Click next page and wait for navigation
      try {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
          page.click(paginationSelector),
        ]);
      } catch (error) {
        console.log(`Navigation error: ${error.message}`);
        break;
      }
      
      currentPage++;
    }
    
    return {
      data: allData,
      pageCount: currentPage,
      totalItems: allData.length,
    };
  }

  /**
   * Execute custom JavaScript on the page
   */
  private async executeScript(page: Page, itemIndex: number): Promise<any> {
    const script = this.getNodeParameter('script', itemIndex) as string;
    
    try {
      // Execute the script in the context of the page
      const result = await page.evaluate(script);
      
      return {
        data: result,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Helper method to prepare binary data
   */
  private async prepareBinaryData(
    data: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<any> {
    // Calculate file size
    const fileSize = data.length;
    
    // Calculate MD5 hash
    const hash = crypto.createHash('md5').update(data).digest('hex');
    
    // Return binary data properties
    return {
      data: data.toString('base64'),
      mimeType,
      fileName,
      fileSize,
      fileExtension: fileName.split('.').pop(),
      hash,
    };
  }
}
