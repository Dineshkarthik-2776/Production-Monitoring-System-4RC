import React, { useState } from "react";
import axios from "axios";
import { useApiData } from "../context/ApiContext"; // Import your API context
import "../css/RecipeMaster.css";

const RecipeMaster = ({ isOpen, onClose, missingWarning, missingRecipes }) => {
  //const { API_BASE_URL } = useApiData(); // Get base URL from context
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [recipes, setRecipes] = useState([
    { id: 1, recipe_code: "", recipe_type: "", target_speed: "" }
  ]);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAddRow = () => {
    const newId = recipes.length > 0 ? Math.max(...recipes.map(r => r.id)) + 1 : 1;
    setRecipes([...recipes, { id: newId, recipe_code: "", recipe_type: "", target_speed: "" }]);
  };

  const handleRemoveRow = (id) => {
    if (recipes.length > 1) {
      setRecipes(recipes.filter(recipe => recipe.id !== id));
    }
  };

  const handleCellChange = (id, field, value) => {
    setRecipes(recipes.map(recipe =>
      recipe.id === id ? { ...recipe, [field]: value } : recipe
    ));
  };

  const handleSubmitManual = async () => {
    console.log("=== MANUAL SUBMIT ===");

    // Clear previous messages
    setError("");
    setSuccess("");

    // Validation: ensure all required fields filled
    const validRecipes = recipes.filter(
      (r) => r.recipe_code.trim() && r.recipe_type.trim() && r.target_speed.trim()
    );

    console.log("Valid recipes:", validRecipes);

    if (validRecipes.length === 0) {
      setError("Please fill at least one complete row");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      console.log("Token:", token ? "Found" : "Not found");

      if (!token) {
        setError("Authentication token not found. Please login again.");
        setLoading(false);
        return;
      }

      // ✅ Correct payload as backend expects
      const payload = {
        data: validRecipes.map((r) => ({
          recipe_code: r.recipe_code,
          target_speed: parseFloat(r.target_speed),
          recipe_type: r.recipe_type,
        })),
      };

      console.log("Payload:", payload);
      console.log("API URL:", `${API_BASE_URL}/api/recipe-upload/`);

      const response = await axios.post(
        `${API_BASE_URL}/api/recipe-upload/`, // ✅ corrected endpoint (underscore)
        payload,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✓ Success:", response.data);
      alert(`✅ ${response.data.message}`);

      setSuccess(
        `Created: ${response.data.created}, Updated: ${response.data.updated}, Total Rows: ${response.data.total_rows}`
      );

      // Fetch updated recipe names after successful upload
      try {
        const recipeResponse = await axios.get(`${API_BASE_URL}/api/recipe-export-master/`, {
          params: { format: 'json' },
          headers: { 'Authorization': `Token ${token}` }
        });

        const recipeNames = Object.keys(recipeResponse.data);
        localStorage.setItem('recipeNames', JSON.stringify(recipeNames));
        console.log('Recipe names updated after manual upload:', recipeNames);
      } catch (recipeErr) {
        console.error('Failed to fetch recipe names after upload:', recipeErr);
      }

      // Reset form
      setRecipes([{ id: 1, recipe_code: "", recipe_type: "", target_speed: "" }]);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("✗ Error:", err);
      console.error("Response:", err.response?.data);

      let errorMessage = "Failed to submit recipes. ";

      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.response?.status) {
        errorMessage += `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage += "Cannot connect to server.";
      } else {
        errorMessage += err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      const validExtensions = ['.csv', '.xls', '.xlsx'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        setError('Please upload a valid CSV, XLS, or XLSX file');
        return;
      }

      console.log("File selected:", file.name, "Size:", file.size, "Type:", file.type);
      setCsvFile(file);
      setError("");
    }
  };

  const handleUploadCSV = async () => {
    console.log("=== FILE UPLOAD ===");

    if (!csvFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem('authToken');
      console.log("Token:", token ? "Found" : "Not found");

      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('excel_file', csvFile); // Changed from 'file' to 'excel_file'

      console.log("Uploading file:", csvFile.name);
      console.log("API URL:", `${API_BASE_URL}/api/recipe-upload/`);
      console.log("FormData field:", 'excel_file');

      const response = await axios.post(
        `${API_BASE_URL}/api/recipe-upload/`, // Updated endpoint
        formData,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('✓ Upload Success:', response.data);
      alert('✓ Upload Success:', response.data);
      setSuccess(`Successfully uploaded file with ${response.data.count || 'multiple'} recipe(s)`);

      // Fetch updated recipe names after successful file upload
      try {
        const recipeResponse = await axios.get(`${API_BASE_URL}/api/recipe-export-master/`, {
          params: { format: 'json' },
          headers: { 'Authorization': `Token ${token}` }
        });

        const recipeNames = Object.keys(recipeResponse.data);
        localStorage.setItem('recipeNames', JSON.stringify(recipeNames));
        console.log('Recipe names updated after file upload:', recipeNames);
      } catch (recipeErr) {
        console.error('Failed to fetch recipe names after file upload:', recipeErr);
      }

      // Reset file input
      setCsvFile(null);
      const fileInput = document.getElementById('csv-file-input');
      if (fileInput) fileInput.value = '';

      setTimeout(() => setSuccess(""), 3000);

    } catch (err) {
      console.error('✗ Upload Error:', err);
      console.error('Response:', err.response?.data);
      console.error('Status:', err.response?.status);

      let errorMessage = 'Failed to upload file. ';

      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.response?.status) {
        errorMessage += `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage += 'Cannot connect to server.';
      } else {
        errorMessage += err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "recipe_code,recipe_type,target_speed\nRC001,Fabric,120\nRC002,Steel,150\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recipe_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    console.log("Template downloaded");
  };

  const handleDownloadMaster = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('authToken');
      // Fetch JSON data (this endpoint works reliably)
      const response = await axios.get(`${API_BASE_URL}/api/recipe-export-master/`, {
        params: { format: 'json' },
        headers: { 'Authorization': `Token ${token}` }
      });

      const data = response.data;

      // Build CSV content from the JSON recipe map
      let csvContent = "recipe_code,recipe_type,target_speed\n";
      for (const [code, info] of Object.entries(data)) {
        csvContent += `${code},${info.type || ''},${info.target_speed || ''}\n`;
      }

      // Download using the same pattern as the working template download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'recipe_master_export.csv';
      link.click();
      window.URL.revokeObjectURL(url);
      setSuccess("Recipe Master downloaded successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Download Error:", err);
      setError("Failed to download recipe master.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="rm-overlay" onClick={onClose} />

      <div className="rm-modal">
        <div className="rm-header">
          <h2 className="rm-title">Recipe Master</h2>
          <button className="rm-close-btn" onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="rm-body">
          {success && (
            <div className="rm-alert rm-alert-success">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="rm-alert rm-alert-error">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {missingWarning && (
            <div className="rm-alert rm-alert-error" style={{ backgroundColor: '#fff3cd', color: '#856404', borderColor: '#ffeeba' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Missing Targets Detected!</strong>
                <span>The following recipes have run on the machine but are missing target speeds:</span>
                <div style={{ marginTop: '5px', fontWeight: 'bold' }}>
                  {missingRecipes.join(', ')}
                </div>
                <span style={{ display: 'block', marginTop: '5px', fontSize: '0.9em' }}>Data processing is paused for these intervals. Please upload them to resume data flow.</span>
              </div>
            </div>
          )}

          <div className="rm-section">
            <h3 className="rm-section-title">Manual Entry</h3>

            <div className="rm-table-container">
              <table className="rm-table">
                <thead>
                  <tr>
                    <th>Recipe Code</th>
                    <th>Recipe Type</th>
                    <th>Target Speed (m/min)</th>
                    <th className="rm-th-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.map((recipe) => (
                    <tr key={recipe.id}>
                      <td>
                        <input
                          type="text"
                          className="rm-input"
                          placeholder="e.g., RC001"
                          value={recipe.recipe_code}
                          onChange={(e) => handleCellChange(recipe.id, 'recipe_code', e.target.value)}
                        />
                      </td>
                      <td>
                        <select
                          className="rm-select"
                          value={recipe.recipe_type}
                          onChange={(e) => handleCellChange(recipe.id, 'recipe_type', e.target.value)}
                        >
                          <option value="">Select Type</option>
                          <option value="Fabric">Fabric</option>
                          <option value="Steel">Steel</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="rm-input"
                          placeholder="e.g., 120"
                          value={recipe.target_speed}
                          onChange={(e) => handleCellChange(recipe.id, 'target_speed', e.target.value)}
                          min="0"
                          step="0.1"
                        />
                      </td>
                      <td className="rm-td-action">
                        <button
                          className="rm-btn-delete"
                          onClick={() => handleRemoveRow(recipe.id)}
                          disabled={recipes.length === 1}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rm-button-group">
              <button className="rm-btn rm-btn-add" onClick={handleAddRow}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Row
              </button>
              <button className="rm-btn rm-btn-submit" onClick={handleSubmitManual} disabled={loading}>
                {loading ? (
                  <span className="rm-spinner"></span>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit Recipes
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="rm-divider">
            <span>OR</span>
          </div>

          <div className="rm-section">
            <h3 className="rm-section-title">Upload File</h3>

            <div className="rm-csv-grid">
              <div className="rm-file-wrapper">
                <input
                  type="file"
                  id="csv-file-input"
                  accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  className="rm-file-input"
                />
                <label htmlFor="csv-file-input" className="rm-file-label">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="rm-file-text">{csvFile ? csvFile.name : 'Click to select file'}</span>
                  <span className="rm-file-hint">CSV, XLS, or XLSX files</span>
                </label>
              </div>

              <div className="rm-csv-actions">
                <button className="rm-btn rm-btn-upload" onClick={handleUploadCSV} disabled={!csvFile || loading}>
                  {loading ? (
                    <span className="rm-spinner rm-spinner-white"></span>
                  ) : (
                    <>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload File
                    </>
                  )}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="rm-btn rm-btn-template" onClick={handleDownloadTemplate} style={{ width: '100%' }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Template
                  </button>
                  <button className="rm-btn rm-btn-template" onClick={handleDownloadMaster} style={{ width: '100%', backgroundColor: '#289d6e', color: 'white', borderColor: '#289d6e' }} disabled={loading}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ filter: 'brightness(0) invert(1)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Currently Active Recipes
                  </button>
                </div>
              </div>
            </div>

            <div className="rm-info-box">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="rm-info-title">File Format Requirements:</p>
                <p>Upload CSV, XLS, or XLSX file with columns: <strong>recipe_code</strong>, <strong>recipe_type</strong> (Fabric or Steel), <strong>target_speed</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecipeMaster;
