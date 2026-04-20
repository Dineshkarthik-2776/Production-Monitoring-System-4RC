import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/RecipeMaster.css"; // Reusing styles for consistency

const StandardTimeMaster = ({ isOpen, onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [standardTimes, setStandardTimes] = useState([]);
  const [originalStandardTimes, setOriginalStandardTimes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showUnsavedPopup, setShowUnsavedPopup] = useState(false);
  const [resultPopup, setResultPopup] = useState({
    isOpen: false,
    type: "success",
    message: "",
  });

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
      setOriginalStandardTimes(response.data);
    } catch (err) {
      console.error("Failed to fetch standard times:", err);
      setError("Failed to load standard times.");
    } finally {
      setLoading(false);
    }
  };

  const handleCellChange = (id, field, value) => {
    setStandardTimes(
      standardTimes.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const hasUnsavedChanges = () => {
    if (standardTimes.length !== originalStandardTimes.length) return true;

    const byId = new Map(originalStandardTimes.map((item) => [item.id, item]));
    return standardTimes.some((item) => {
      const original = byId.get(item.id);
      if (!original) return true;
      return Number(item.standard_time) !== Number(original.standard_time);
    });
  };

  const requestClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedPopup(true);
      return;
    }
    onClose();
  };

  const handleRollback = () => {
    setStandardTimes(originalStandardTimes);
    setShowUnsavedPopup(false);
    setError("");
  };

  const openResultPopup = (type, message) => {
    setResultPopup({ isOpen: true, type, message });
  };

  const handleExitWithoutUpdate = () => {
    setShowUnsavedPopup(false);
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    const validData = standardTimes.filter(
      (item) =>
        item.changeover_key &&
        item.standard_time !== "" &&
        !Number.isNaN(Number(item.standard_time)) &&
        Number(item.standard_time) >= 1
    );

    if (validData.length !== standardTimes.length) {
      setError("All standard time values are required and must be 1 or greater.");
      openResultPopup("error", "All standard time values are required and must be 1 or greater before update.");
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

      setSuccess("Standard times updated successfully!");
      openResultPopup("success", "Standard times saved successfully.");
      fetchStandardTimes();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Save Error:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || "Failed to save standard times.";
      setError(errorMessage);
      openResultPopup("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="rm-overlay" onClick={requestClose} />

      <div className="rm-modal">
        <div className="rm-header">
          <h2 className="rm-title">Standard Time Master</h2>
          <button className="rm-close-btn" onClick={requestClose}>
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
                          readOnly
                          disabled
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="rm-input"
                          placeholder="e.g., 60"
                          value={item.standard_time}
                          onChange={(e) => handleCellChange(item.id, "standard_time", e.target.value)}
                          min="1"
                          step="1"
                        />
                      </td>
                    </tr>
                  ))}
                  {standardTimes.length === 0 && !loading && (
                    <tr>
                      <td colSpan="2" style={{ textAlign: "center", padding: "20px", color: "#666" }}>
                        No standard times configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="rm-button-group">
              <button className="rm-btn rm-btn-submit" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <span className="rm-spinner"></span>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showUnsavedPopup && (
        <>
          <div className="rm-overlay" />
          <div className="rm-modal" style={{ maxWidth: "520px", width: "90vw", maxHeight: "unset" }}>
            <div className="rm-header">
              <h2 className="rm-title" style={{ fontSize: "20px" }}>Unsaved Changes</h2>
            </div>
            <div className="rm-body" style={{ paddingTop: "20px" }}>
              <p style={{ marginTop: 0, marginBottom: "20px", color: "#374151" }}>
                You changed standard time values and have not clicked Update All.
              </p>
              <div className="rm-button-group" style={{ justifyContent: "flex-end" }}>
                <button className="rm-btn rm-btn-add" onClick={() => setShowUnsavedPopup(false)}>
                  Cancel
                </button>
                <button className="rm-btn rm-btn-add" onClick={handleRollback}>
                  Rollback Old Values
                </button>
                <button className="rm-btn rm-btn-submit" onClick={handleExitWithoutUpdate}>
                  Exit Without Update
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {resultPopup.isOpen && (
        <>
          <div className="rm-overlay" onClick={() => setResultPopup((prev) => ({ ...prev, isOpen: false }))} />
          <div className="rm-modal" style={{ maxWidth: "520px", width: "90vw", maxHeight: "unset" }}>
            <div className="rm-header">
              <h2 className="rm-title" style={{ fontSize: "20px" }}>
                {resultPopup.type === "success" ? "Update Successful" : "Update Failed"}
              </h2>
            </div>
            <div className="rm-body" style={{ paddingTop: "20px" }}>
              <div className={`rm-alert ${resultPopup.type === "success" ? "rm-alert-success" : "rm-alert-error"}`} style={{ marginBottom: "20px" }}>
                <span>{resultPopup.message}</span>
              </div>
              <div className="rm-button-group" style={{ justifyContent: "flex-end" }}>
                <button
                  className="rm-btn rm-btn-submit"
                  onClick={() => setResultPopup((prev) => ({ ...prev, isOpen: false }))}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default StandardTimeMaster;
