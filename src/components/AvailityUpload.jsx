import "./AvailityUpload.css"

function AvailityUpload({ ediContent }) {
  const isDisabled = !ediContent;

  function handleUpload() {
    alert("Mock upload to Availity — EDI file sent!");
  }

  return (
    <div className="pipeline-step">
      <p className="step-label">3. Upload to Availity</p>
      <button className="availity-btn" onClick={handleUpload} disabled={isDisabled}>
        Upload to Availity
      </button>
    </div>
  );
}

export default AvailityUpload;