import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface InvoiceData {
  id: string
  invoiceNumber: string
  client: string
  dateIssued: string
  dueDate: string
  subtotal: number
  tax: number
  total: number
  description: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
}

interface WorkspaceData {
  name: string
  address?: string
  email?: string
  phone?: string
  website?: string
  currency?: string
}

export async function exportInvoiceToPdf(
  invoiceData: InvoiceData,
  workspaceData: WorkspaceData,
  templateHtml?: string,
  filename?: string
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    // Create invoice HTML element
    const invoiceElement = createInvoiceElement(invoiceData, workspaceData, templateHtml)
    
    // Temporarily add to DOM for rendering
    document.body.appendChild(invoiceElement)
    
    // Generate canvas from HTML
    const canvas = await html2canvas(invoiceElement, { 
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })
    
    // Remove element from DOM
    document.body.removeChild(invoiceElement)
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // Calculate dimensions
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    
    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    
    // Generate filename
    const currentDate = new Date().toISOString().split('T')[0]
    const defaultFilename = `invoice_${invoiceData.invoiceNumber}_${currentDate}.pdf`
    
    // Save PDF
    pdf.save(filename || defaultFilename)
    
    return { success: true, filename: filename || defaultFilename }
  } catch (error) {
    console.error('PDF export error:', error)
    return { success: false, error: 'Failed to export invoice to PDF' }
  }
}

function createInvoiceElement(invoiceData: InvoiceData, workspaceData: WorkspaceData, templateHtml?: string): HTMLElement {
  const element = document.createElement('div')
  element.style.position = 'absolute'
  element.style.left = '-9999px'
  element.style.top = '0'
  element.style.width = '210mm' // A4 width
  element.style.backgroundColor = '#ffffff'
  element.style.fontFamily = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  element.style.fontSize = '14px'
  element.style.lineHeight = '1.5'
  element.style.color = '#333333'
  
  if (templateHtml) {
    // Use custom template
    element.innerHTML = replaceTemplatePlaceholders(templateHtml, invoiceData, workspaceData)
  } else {
    // Use default template
    element.innerHTML = createDefaultInvoiceHTML(invoiceData, workspaceData)
  }
  
  return element
}

function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'MYR': 'RM',
    'SGD': 'S$',
    'AUD': 'A$',
    'JPY': '¥'
  }
  return symbols[currency] || '$'
}

function replaceTemplatePlaceholders(templateHtml: string, invoiceData: InvoiceData, workspaceData: WorkspaceData): string {
  let html = templateHtml
  
  // Replace workspace placeholders
  html = html.replace(/\{\{workspace\.name\}\}/g, workspaceData.name || '')
  html = html.replace(/\{\{workspace\.address\}\}/g, workspaceData.address || '')
  html = html.replace(/\{\{workspace\.email\}\}/g, workspaceData.email || '')
  html = html.replace(/\{\{workspace\.phone\}\}/g, workspaceData.phone || '')
  html = html.replace(/\{\{workspace\.website\}\}/g, workspaceData.website || '')
  
  // Replace invoice placeholders
  html = html.replace(/\{\{invoice\.number\}\}/g, invoiceData.invoiceNumber)
  html = html.replace(/\{\{invoice\.date\}\}/g, invoiceData.dateIssued)
  html = html.replace(/\{\{invoice\.dueDate\}\}/g, invoiceData.dueDate)
  html = html.replace(/\{\{invoice\.description\}\}/g, invoiceData.description)
  // Get currency symbol based on workspace settings
  const currencySymbol = getCurrencySymbol(workspaceData.currency || 'MYR')
  html = html.replace(/\{\{subtotal\}\}/g, `${currencySymbol}${invoiceData.subtotal.toFixed(2)}`)
  html = html.replace(/\{\{tax\}\}/g, `${currencySymbol}${invoiceData.tax.toFixed(2)}`)
  html = html.replace(/\{\{total\}\}/g, `${currencySymbol}${invoiceData.total.toFixed(2)}`)
  
  // Replace client placeholders
  html = html.replace(/\{\{client\.name\}\}/g, invoiceData.client)
  
  // Replace items table
  if (html.includes('{{items_table}}')) {
    const currencySymbol = getCurrencySymbol(workspaceData.currency || 'MYR')
    const itemsTable = createItemsTable(invoiceData.items, currencySymbol)
    html = html.replace(/\{\{items_table\}\}/g, itemsTable)
  }
  
  return html
}

function createDefaultInvoiceHTML(invoiceData: InvoiceData, workspaceData: WorkspaceData): string {
  const currencySymbol = getCurrencySymbol(workspaceData.currency || 'MYR')
  
  return `
    <div style="padding: 40px; max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; color: #000; background: #fff;">
          <!-- Header Section -->
          <div style="margin-bottom: 30px;">
            <!-- INVOICE Title (Top Right) -->
            <div style="text-align: right; margin-bottom: 15px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #000;">INVOICE</h1>
            </div>
            
            <!-- From, To, Date Row -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <!-- Left Section (From + To) -->
              <div style="display: flex; flex: 2; gap: 80px;">
                <!-- From Section -->
                <div>
                  <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #000;">From:</h3>
                  <div style="line-height: 1.2;">
                    <p style="margin: 0 0 3px 0; font-weight: bold; font-size: 14px; color: #000;">${workspaceData.name || 'Sattiyan Selvarajah'}</p>
                    <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">23, Taman Tai Chong,</p>
                    <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">31100 Sungai Siput (U),</p>
                    <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">Perak</p>
                    ${workspaceData.phone ? `<p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">Phone: ${workspaceData.phone}</p>` : ''}
                    ${workspaceData.email ? `<p style="margin: 0; font-size: 12px; color: #000;">Email: ${workspaceData.email}</p>` : ''}
                  </div>
                </div>
                
                <!-- To Section -->
                <div>
                  <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #000;">To:</h3>
                  <div style="line-height: 1.2;">
                    <p style="margin: 0; font-weight: bold; font-size: 14px; color: #000;">${invoiceData.client}</p>
                  </div>
                </div>
              </div>
              
              <!-- Date (Far Right) -->
              <div style="text-align: right; flex: 1;">
                <p style="margin: 0; font-size: 12px; color: #000;">Date: ${invoiceData.dateIssued}</p>
              </div>
            </div>
          </div>
      
      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; border: 1px solid #000;">
        <thead>
          <tr style="background-color: #000;">
            <th style="border: 1px solid #000; padding: 12px; text-align: left; font-weight: bold; font-size: 14px; color: #fff;">No</th>
            <th style="border: 1px solid #000; padding: 12px; text-align: left; font-weight: bold; font-size: 14px; color: #fff;">Description</th>
            <th style="border: 1px solid #000; padding: 12px; text-align: right; font-weight: bold; font-size: 14px; color: #fff;">Amount (RM)</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceData.items.map((item, index) => `
            <tr>
              <td style="border: 1px solid #000; padding: 12px; text-align: left; font-size: 14px; color: #000;">${index + 1}</td>
              <td style="border: 1px solid #000; padding: 12px; font-size: 14px; color: #000;">
                <div style="margin-bottom: 5px; font-weight: bold; font-size: 14px;">${item.description}</div>
                ${item.description.includes('Development Support') ? `
                  <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #000; line-height: 1.2;">
                    <li style="margin-bottom: 3px;">IPF - Experian Report fixes</li>
                    <li style="margin-bottom: 3px;">IPF - Policy Street Implementation</li>
                    <li style="margin-bottom: 3px;">IPF - ANGKASA eSPGA fixes</li>
                    <li style="margin-bottom: 3px;">IPF - Comment Notification enhancement</li>
                    <li style="margin-bottom: 0;">IPF - Misc bug fixes</li>
                  </ul>
                ` : ''}
              </td>
              <td style="border: 1px solid #000; padding: 12px; text-align: right; font-size: 14px; font-weight: bold; color: #000;">${currencySymbol} ${item.total.toFixed(0)}</td>
            </tr>
          `).join('')}
          <!-- Total Row -->
          <tr>
            <td style="border: 1px solid #000; padding: 12px;"></td>
            <td style="border: 1px solid #000; padding: 12px; font-weight: bold; font-size: 14px; color: #000; text-align: right;">Total</td>
            <td style="border: 1px solid #000; padding: 12px; text-align: right; font-weight: bold; font-size: 14px; color: #000;">${currencySymbol} ${invoiceData.total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
          <!-- Payment Details Section -->
          <div style="margin-top: 25px;">
            <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #000;">Payment details:</h3>
            <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">Please make the payment to the following bank account:</p>
            <div style="line-height: 1.2;">
              <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;"><strong>Account Name:</strong> ${workspaceData.name || 'SATTIYAN SELVARAJAH'}</p>
              <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;"><strong>Bank Name:</strong> MAYBANK BERHAD</p>
              <p style="margin: 0; font-size: 12px; color: #000;"><strong>Account No:</strong> 1582 0230 4486</p>
            </div>
          </div>
          
          <!-- Closing Message -->
          <div style="text-align: left; margin-top: 30px;">
            <p style="margin: 0; font-size: 12px; color: #000;">Thank you! Please let me know if you need additional details.</p>
          </div>
    </div>
  `
}

function createItemsTable(items: InvoiceData['items'], currencySymbol: string = 'RM'): string {
  return items.map((item, index) => `
    <tr>
      <td style="border: 1px solid #000; padding: 12px; text-align: left; font-size: 14px; color: #000;">${index + 1}</td>
      <td style="border: 1px solid #000; padding: 12px; font-size: 14px; color: #000;">
        <div style="margin-bottom: 5px; font-weight: bold; font-size: 14px;">${item.description}</div>
        ${item.description.includes('Development Support') ? `
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #000;">
            <li style="margin-bottom: 2px;">IPF - Experian Report fixes</li>
            <li style="margin-bottom: 2px;">IPF - Policy Street Implementation</li>
            <li style="margin-bottom: 2px;">IPF - ANGKASA eSPGA fixes</li>
            <li style="margin-bottom: 2px;">IPF - Comment Notification enhancement</li>
            <li style="margin-bottom: 0;">IPF - Misc bug fixes</li>
          </ul>
        ` : ''}
      </td>
      <td style="border: 1px solid #000; padding: 12px; text-align: right; font-size: 14px; font-weight: bold; color: #000;">${currencySymbol} ${item.total.toFixed(0)}</td>
    </tr>
  `).join('')
}

export async function exportTimesheetsToPdf(
  timesheets: any[],
  filename?: string
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const element = document.createElement('div')
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    element.style.top = '0'
    element.style.width = '210mm'
    element.style.backgroundColor = '#ffffff'
    element.style.fontFamily = 'Inter, system-ui, sans-serif'
    element.style.fontSize = '12px'
    element.style.padding = '20px'
    
    element.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="margin: 0; color: #2563eb; font-size: 24px;">Timesheet Report</h1>
        <p style="margin: 5px 0; color: #6b7280;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f9fafb;">
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Date</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Project</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Client</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Hours</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Description</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">Billable</th>
            <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${timesheets.map(t => `
            <tr>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${t.date}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${t.project}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${t.client}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${t.hours}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px;">${t.description}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${t.billable ? 'Yes' : 'No'}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">$${t.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="margin-top: 30px; text-align: right;">
        <p style="margin: 0; font-weight: bold;">Total Hours: ${timesheets.reduce((sum, t) => sum + t.hours, 0).toFixed(1)}</p>
        <p style="margin: 5px 0; font-weight: bold;">Total Revenue: $${timesheets.reduce((sum, t) => sum + t.total, 0).toFixed(2)}</p>
      </div>
    `
    
    document.body.appendChild(element)
    
    const canvas = await html2canvas(element, { scale: 2, useCORS: true })
    document.body.removeChild(element)
    
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    
    const currentDate = new Date().toISOString().split('T')[0]
    const defaultFilename = `timesheet_report_${currentDate}.pdf`
    
    pdf.save(filename || defaultFilename)
    
    return { success: true, filename: filename || defaultFilename }
  } catch (error) {
    console.error('PDF export error:', error)
    return { success: false, error: 'Failed to export timesheets to PDF' }
  }
}
