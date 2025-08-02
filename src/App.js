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
      const apiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:8000').replace(/\/$/, '');
      console.log('Uploading to:', `${apiUrl}/process`);
      
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
          </div>
        )}

        {result && (
          <div className="result-section">
            <h2>✅ Extraction Results</h2>
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

            <div className="json-output">
              <h3>📋 JSON Output</h3>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
