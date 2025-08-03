import React, { useState } from 'react';
import './App.css';

// Helper function to convert JSON to CSV
const convertToCSV = (data) => {
  const extractedData = data.extracted_data || {};
  const rows = [
    ['Field', 'Value'],
    ['Vendor Name', extractedData.vendor_name || 'Not found'],
    ['Vendor Email', extractedData.vendor_email || 'Not found'],
    ['Vendor Phone', extractedData.vendor_phone || 'Not found'],
    ['Invoice Number', extractedData.invoice_number || 'Not found'],
    ['Invoice Date', extractedData.invoice_date || 'Not found'],
    ['VAT Number', extractedData.vat_number || 'Not found'],
    ['Total Amount', extractedData.total_amount || 'Not found'],
    ['Subtotal', extractedData.subtotal || 'Not found'],
    ['Tax Amount', extractedData.tax_amount || 'Not found'],
    ['Payment Terms', extractedData.payment_terms || 'Not found'],
    ['Dates Found', (extractedData.dates_found || []).join(', ') || 'None'],
    ['Processing Method', data.processing_method || 'Unknown'],
    ['Processing Time', data.processing_timestamp || 'Unknown'],
    ['Confidence Score', data.confidence_scores?.overall || 'Not available']
  ];
  return rows.map(row => row.join(',')).join('\n');
};

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [processingMethod, setProcessingMethod] = useState('ai');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('processing_method', processingMethod);

    try {
      const apiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      console.log('Uploading to:', `${apiUrl}/process`);
      console.log('Processing method:', processingMethod);
      
      const response = await fetch(`${apiUrl}/process`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      if (data.detail) {
        throw new Error(`Server error: ${data.detail}`);
      }

      if (!data.extracted_data) {
        console.warn('No extracted_data in response, creating empty structure');
        data.extracted_data = {
          vendor_name: null,
          vendor_email: null,
          vendor_phone: null,
          invoice_number: null,
          customer_number: null,
          vat_number: null,
          total_amount: null,
          dates_found: []
        };
      }

      setResult(data);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(`Error processing invoice: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!result) return;
    
    const csvContent = convertToCSV(result);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `invoice_data_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖📄 AI-Powered Invoice Processing System</h1>
        <p>Upload your invoice (PDF, photo, or scanned image) to extract structured data</p>
      </header>

      <main className="App-main">
        <div className="upload-section">
          <h2>Upload Invoice</h2>
          
          {/* Processing Method Selection */}
          <div className="processing-options">
            <h3>Choose Processing Method:</h3>
            <div className="method-description">
              {processingMethod === 'ai' ? (
                <p>
                  🤖 <strong>AI Processing:</strong> Uses Google Gemini AI for superior accuracy on complex invoices. Best for handling various invoice formats.
                </p>
              ) : (
                <p>
                  📄 <strong>Traditional OCR:</strong> Uses local processing for privacy-conscious users. Best for standard invoice formats.
                </p>
              )}
            </div>
            <div className="radio-group">
              <label className="radio-option">
                <input 
                  type="radio" 
                  name="processing" 
                  value="ai" 
                  checked={processingMethod === 'ai'}
                  onChange={(e) => setProcessingMethod(e.target.value)}
                />
                <span className="radio-label">
                  🤖 <strong>AI Processing</strong>
                  <small>Uses Google Gemini AI for superior accuracy on complex invoices. More accurate but data is processed by Google's AI service.</small>
                </span>
              </label>
              
              <label className="radio-option">
                <input 
                  type="radio" 
                  name="processing" 
                  value="traditional" 
                  checked={processingMethod === 'traditional'}
                  onChange={(e) => setProcessingMethod(e.target.value)}
                />
                <span className="radio-label">
                  🔒 <strong>Traditional OCR</strong>
                  <small>Processes your invoice locally using Tesseract OCR. More private but may be less accurate on complex layouts.</small>
                </span>
              </label>
            </div>
          </div>

          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.bmp,.webp"
            onChange={handleFileChange}
            className="file-input"
          />
          
          {file && (
            <div className="file-info">
              <p>Selected: <strong>{file.name}</strong></p>
              <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <p>Type: {file.type || 'Unknown'}</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="upload-button"
          >
            {loading ? (
              processingMethod === 'ai' ? '🤖 AI Processing...' : '🔍 OCR Processing...'
            ) : (
              processingMethod === 'ai' ? '🚀 Process with AI' : '🚀 Process with OCR'
            )}
          </button>
        </div>

        {error && (
          <div className="error-section">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="result-section">
            <h2>✅ Extraction Results</h2>
            
            <div className="processing-info">
              <h3>📊 Processing Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Method Used:</strong> {result.processing_method || 'Unknown'}
                </div>
                <div className="info-item">
                  <strong>Confidence:</strong> {result.confidence || 'Unknown'}
                </div>
                <div className="info-item">
                  <strong>AI Processing:</strong> {result.ai_processing ? '✅ Yes' : '❌ No'}
                </div>
                <div className="info-item">
                  <strong>Success:</strong> {result.success ? '✅ Yes' : '❌ No'}
                </div>
              </div>
            </div>

            <div className="extraction-results">
              <h3>🔍 Extracted Data</h3>
              <div className="result-grid">
                <div className="result-item">
                  <strong>Vendor Name:</strong>
                  <span>{result.extracted_data?.vendor_name || 'Not found'}</span>
                </div>
                <div className="result-item">
                  <strong>Vendor Phone:</strong>
                  <span>{result.extracted_data?.vendor_phone || 'Not found'}</span>
                </div>
                <div className="result-item">
                  <strong>Vendor Email:</strong>
                  <span>{result.extracted_data?.vendor_email || 'Not found'}</span>
                </div>
                <div className="result-item">
                  <strong>Invoice Number:</strong>
                  <span>{result.extracted_data?.invoice_number || 'Not found'}</span>
                </div>
                <div className="result-item">
                  <strong>Customer Number:</strong>
                  <span>{result.extracted_data?.customer_number || 'Not found'}</span>
                </div>
                <div className="result-item">
                  <strong>VAT Number:</strong>
                  <span>{result.extracted_data?.vat_number || 'Not found'}</span>
                </div>
                <div className="result-item">
                  <strong>Total Amount:</strong>
                  <span>{result.extracted_data?.total_amount || 'Not found'}</span>
                </div>
                <div className="result-item">
                  <strong>Dates Found:</strong>
                  <span>{result.extracted_data?.dates_found?.join(', ') || 'Not found'}</span>
                </div>
              </div>
            </div>

            <div className="json-output">
              <h3>📋 Complete JSON Response</h3>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>🤖 AI-Powered with Google Gemini + 🔍 Traditional OCR with Tesseract</p>
        <p>Supports PDF, JPG, PNG, TIFF, BMP, and WebP formats</p>
      </footer>
    </div>
  );
}

export default App;
