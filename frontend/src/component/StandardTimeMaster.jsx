import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/RecipeMaster.css"; // Reusing styles for consistency

const StandardTimeMaster = ({ isOpen, onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [standardTimes, setStandardTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchStandardTimes();
    }
  }, [isOpen]);

  const fetchStandardTimes = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}/api/standard-time/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setStandardTimes(response.data);
    } catch (err) {
      console.error("Failed to fetch standard times:", err);
      setError("Failed to load standard times.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    const newId = Date.now(); // Temporary unique ID
    setStandardTimes([
      ...standardTimes,
      { id: newId, isNew: true, changeover_key: "", standard_time: "" },
    ]);
  };

  const handleRemoveRow = async (id, isNew) => {
    if (isNew) {
      setStandardTimes(standardTimes.filter((item) => item.id !== id));
      return;
    }

    if (!window.confirm("Are you sure you want to delete this standard time?")) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${API_BASE_URL}/api/standard-time/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setStandardTimes(standardTimes.filter((item) => item.id !== id));
      setSuccess("Deleted successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to delete:", err);
      setError("Failed to delete record.");
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (id, field, value) => {
    setStandardTimes(
      standardTimes.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    const validData = standardTimes.filter(
      (item) => item.changeover_key.trim() && item.standard_time !== ""
    );

    if (validData.length === 0) {
      setError("Please fill at least one complete row.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const payload = validData.map((item) => ({
        changeover_key: item.changeover_key,
        standard_time: parseFloat(item.standard_time),
      }));

      await axios.post(`${API_BASE_URL}/api/standard-time/`, payload, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      setSuccess("Standard times saved successfully!");
      fetchStandardTimes(); // Refresh to get proper IDs from DB
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Save Error:", err);
      setError(err.response?.data?.error || "Failed to save standard times.");
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
          <h2 className="rm-title">Standard Time Master</h2>
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

          <div className="rm-section">
            <h3 className="rm-section-title">Manage Standard Times</h3>
            <p className="rm-info-box" style={{ marginBottom: "15px", padding: "10px", fontSize: "0.9em" }}>
              These values are used to calculate "Shoot" (Overshoot) in the dashboard. 
              Keys must match exactly (e.g., "Steel to Steel").
            </p>

            <div className="rm-table-container">
              <table className="rm-table">
                <thead>
                  <tr>
                    <th>Changeover Type (Key)</th>
                    <th>Standard Time (min)</th>
                    <th className="rm-th-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {standardTimes.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="text"
                          className="rm-input"
                          placeholder="e.g., Fabric to Steel"
                          value={item.changeover_key}
                          onChange={(e) => handleCellChange(item.id, "changeover_key", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="rm-input"
                          placeholder="e.g., 60"
                          value={item.standard_time}
                          onChange={(e) => handleCellChange(item.id, "standard_time", e.target.value)}
                          min="0"
                          step="1"
                        />
                      </td>
                      <td className="rm-td-action">
                        <button
                          className="rm-btn-delete"
                          onClick={() => handleRemoveRow(item.id, item.isNew)}
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {standardTimes.length === 0 && !loading && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                        No standard times configured. Click "Add Row" to start.
                      </td>
                    </tr>
                  )}
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
              <button className="rm-btn rm-btn-submit" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <span className="rm-spinner"></span>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StandardTimeMaster;
