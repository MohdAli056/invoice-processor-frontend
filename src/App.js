import React, { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

    try {
      // Clean API URL to prevent double slashes
      const apiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      
      console.log('Uploading to:', `${apiUrl}/process`);
      console.log('File details:', { name: file.name, size: file.size, type: file.type });
      
      const response = await fetch(`${apiUrl}/process`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      // Validate the response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      // Check if it's an error response
      if (data.detail) {
        throw new Error(`Server error: ${data.detail}`);
      }

      // Ensure extracted_data exists
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>📄 Invoice Processing System</h1>
        <p>Upload your invoice (PDF, photo, or scanned image) to extract structured data</p>
      </header>

      <main className="App-main">
        <div className="upload-section">
          <h2>Upload Invoice</h2>
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
            {loading ? '🔄 Processing...' : '🚀 Process Invoice'}
          </button>
        </div>

        {error && (
          <div className="error-section">
            <h3>❌ Error</h3>
            <p>{error}</p>
            <details style={{marginTop: '10px', fontSize: '0.9em', color: '#666'}}>
              <summary>Debug Information</summary>
              <p>API URL: {process.env.REACT_APP_API_URL || 'http://localhost:8000'}</p>
              <p>File: {file ? `${file.name} (${file.size} bytes)` : 'None selected'}</p>
              <p>Check browser console for detailed logs</p>
            </details>
          </div>
        )}

        {result && (
          <div className="result-section">
            <h2>✅ Extraction Results</h2>
            
            {/* File Information */}
            <div className="file-summary">
              <h3>📁 File Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Filename:</strong> {result.filename || 'Unknown'}
                </div>
                <div className="info-item">
                  <strong>File Size:</strong> {result.file_size_bytes ? `${(result.file_size_bytes / 1024).toFixed(1)} KB` : 'Unknown'}
                </div>
                <div className="info-item">
                  <strong>File Type:</strong> {result.file_type || 'Unknown'}
                </div>
                <div className="info-item">
                  <strong>Processing Status:</strong> {result.success ? '✅ Success' : '❌ Failed'}
                </div>
              </div>
            </div>

            {/* Extracted Data */}
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

            {/* JSON Output */}
            <div className="json-output">
              <h3>📋 Complete JSON Response</h3>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>

            {/* Download Options */}
            <div className="download-section">
              <h3>💾 Export Results</h3>
              <button 
                className="download-button"
                onClick={() => {
                  const dataStr = JSON.stringify(result, null, 2);
                  const dataBlob = new Blob([dataStr], {type: 'application/json'});
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `invoice-extraction-${Date.now()}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                📄 Download JSON
              </button>
              
              <button 
                className="download-button"
                onClick={() => {
                  const csvData = [
                    ['Field', 'Value'],
                    ['Vendor Name', result.extracted_data?.vendor_name || ''],
                    ['Vendor Email', result.extracted_data?.vendor_email || ''],
                    ['Vendor Phone', result.extracted_data?.vendor_phone || ''],
                    ['Invoice Number', result.extracted_data?.invoice_number || ''],
                    ['Customer Number', result.extracted_data?.customer_number || ''],
                    ['VAT Number', result.extracted_data?.vat_number || ''],
                    ['Total Amount', result.extracted_data?.total_amount || ''],
                    ['Dates Found', result.extracted_data?.dates_found?.join('; ') || '']
                  ];
                  
                  const csvContent = csvData.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
                  const dataBlob = new Blob([csvContent], {type: 'text/csv'});
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `invoice-extraction-${Date.now()}.csv`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                📊 Download CSV
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>Built with React, FastAPI, Tesseract OCR, and intelligent NLP processing</p>
        <p>Supports PDF, JPG, PNG, TIFF, BMP, and WebP formats</p>
      </footer>
    </div>
  );
}

export default App;
