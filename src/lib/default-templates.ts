// Default invoice template for Sattiyan Selvarajah workspace
export const DEFAULT_INVOICE_TEMPLATE = `
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
                <p style="margin: 0 0 3px 0; font-weight: bold; font-size: 14px; color: #000;">{{workspace.name}}</p>
                <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">23, Taman Tai Chong,</p>
                <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">31100 Sungai Siput (U),</p>
                <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">Perak</p>
                <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">Phone: {{workspace.phone}}</p>
                <p style="margin: 0; font-size: 12px; color: #000;">Email: {{workspace.email}}</p>
              </div>
            </div>
            
            <!-- To Section -->
            <div>
              <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #000;">To:</h3>
              <div style="line-height: 1.2;">
                <p style="margin: 0; font-weight: bold; font-size: 14px; color: #000;">{{client.name}}</p>
              </div>
            </div>
          </div>
          
          <!-- Date (Far Right) -->
          <div style="text-align: right; flex: 1;">
            <p style="margin: 0; font-size: 12px; color: #000;">Date: {{invoice.date}}</p>
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
      {{items_table}}
      <!-- Total Row -->
      <tr>
        <td style="border: 1px solid #000; padding: 12px;"></td>
        <td style="border: 1px solid #000; padding: 12px; font-weight: bold; font-size: 14px; color: #000; text-align: right;">Total</td>
        <td style="border: 1px solid #000; padding: 12px; text-align: right; font-weight: bold; font-size: 14px; color: #000;">RM {{total}}</td>
      </tr>
    </tbody>
  </table>
  
      <!-- Payment Details Section -->
      <div style="margin-top: 25px;">
        <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: #000;">Payment details:</h3>
        <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;">Please make the payment to the following bank account:</p>
        <div style="line-height: 1.2;">
          <p style="margin: 0 0 3px 0; font-size: 12px; color: #000;"><strong>Account Name:</strong> {{workspace.name}}</p>
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

// Helper function to create items table for the template
export function createTemplateItemsTable(items: Array<{description: string, total: number}>, currencySymbol: string = 'RM'): string {
  return items.map((item, index) => `
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
  `).join('')
}
