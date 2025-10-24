import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export function getCurrencySymbol(currency: string): string {
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
  return symbols[currency] || 'RM'
}

interface TimesheetExportData {
  id: string
  date: string
  project: string
  client: string
  hours: number
  description: string
  billable: boolean
  hourlyRate: number
  total: number
}

export function exportTimesheetsToExcel(timesheets: TimesheetExportData[], filename?: string, currency: string = 'MYR') {
  try {
    const currencySymbol = getCurrencySymbol(currency)
    
    // Transform data for Excel export
    const data = timesheets.map(t => ({
      'Date': t.date,
      'Project': t.project,
      'Client': t.client,
      'Hours': t.hours,
      'Description': t.description,
      'Billable': t.billable ? 'Yes' : 'No',
      'Hourly Rate': `${currencySymbol}${t.hourlyRate}`,
      'Total': `${currencySymbol}${t.total}`
    }))

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheets')

    // Set column widths
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 20 }, // Project
      { wch: 20 }, // Client
      { wch: 8 },  // Hours
      { wch: 40 }, // Description
      { wch: 10 }, // Billable
      { wch: 12 }, // Hourly Rate
      { wch: 12 }  // Total
    ]
    ws['!cols'] = colWidths

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0]
    const defaultFilename = `timesheets_${currentDate}.xlsx`
    
    // Convert to array buffer and save
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename || defaultFilename)
    
    return { success: true, filename: filename || defaultFilename }
  } catch (error) {
    console.error('Excel export error:', error)
    return { success: false, error: 'Failed to export timesheets to Excel' }
  }
}

export function exportProjectsToExcel(projects: any[], filename?: string, currency: string = 'MYR') {
  try {
    const currencySymbol = getCurrencySymbol(currency)
    
    const data = projects.map(p => ({
      'Project Name': p.name,
      'Project Code': p.code,
      'Client': p.client,
      'Hourly Rate': `${currencySymbol}${p.hourlyRate}`,
      'Status': p.status,
      'Total Hours': p.totalHours,
      'Total Revenue': `${currencySymbol}${p.totalRevenue}`,
      'Last Activity': p.lastActivity,
      'Created': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Projects')

    const colWidths = [
      { wch: 25 }, // Project Name
      { wch: 15 }, // Project Code
      { wch: 20 }, // Client
      { wch: 12 }, // Hourly Rate
      { wch: 12 }, // Status
      { wch: 12 }, // Total Hours
      { wch: 15 }, // Total Revenue
      { wch: 15 }, // Last Activity
      { wch: 12 }  // Created
    ]
    ws['!cols'] = colWidths

    const currentDate = new Date().toISOString().split('T')[0]
    const defaultFilename = `projects_${currentDate}.xlsx`
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename || defaultFilename)
    
    return { success: true, filename: filename || defaultFilename }
  } catch (error) {
    console.error('Excel export error:', error)
    return { success: false, error: 'Failed to export projects to Excel' }
  }
}

export function exportClientsToExcel(clients: any[], filename?: string, currency: string = 'MYR') {
  try {
    const currencySymbol = getCurrencySymbol(currency)
    
    const data = clients.map(c => ({
      'Client Name': c.name,
      'Email': c.email,
      'Phone': c.phone,
      'Address': c.address,
      'Status': c.status,
      'Total Projects': c.totalProjects,
      'Total Revenue': `${currencySymbol}${c.totalRevenue}`,
      'Last Contact': c.lastContact,
      'Created': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clients')

    const colWidths = [
      { wch: 25 }, // Client Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 40 }, // Address
      { wch: 12 }, // Status
      { wch: 15 }, // Total Projects
      { wch: 15 }, // Total Revenue
      { wch: 15 }, // Last Contact
      { wch: 12 }  // Created
    ]
    ws['!cols'] = colWidths

    const currentDate = new Date().toISOString().split('T')[0]
    const defaultFilename = `clients_${currentDate}.xlsx`
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), filename || defaultFilename)
    
    return { success: true, filename: filename || defaultFilename }
  } catch (error) {
    console.error('Excel export error:', error)
    return { success: false, error: 'Failed to export clients to Excel' }
  }
}
