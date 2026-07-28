import { useState } from "react";
import "./EdiGenerator.css";
import { generateEdi } from "../api";

function EdiGenerator({ setEdiContent }) {
  const [generatedFile, setGeneratedFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setGeneratedFile(null);

    try {
      const result = await generateEdi();
      setEdiContent(result.ediContent);
      setGeneratedFile(result);
    } catch (err) {
      setEdiContent(null);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  function downloadEdi() {
    if (!generatedFile) return;

    const blob = new Blob([generatedFile.ediContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `837P_${String(generatedFile.controlNumber).padStart(9, '0')}.edi`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <div className="pipeline-step">
      <p className="step-label">2. Generate 837P</p>
      <button className="edi-btn" onClick={handleGenerate} disabled={generating}>
        {generating ? "Generating..." : "Convert to 837P"}
      </button>
      {generatedFile && (
        <button className="edi-btn" onClick={downloadEdi}>
          Download 837P File ({generatedFile.claimCount} claims)
        </button>
      )}
      {error && <p className="edi-error">{error}</p>}
    </div>
  );
}

export default EdiGenerator;