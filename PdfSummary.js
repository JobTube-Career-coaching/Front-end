import React, { useState } from 'react';
import axios from 'axios';
import "../styles/PdfSummary.css"

function PdfSummary() {
    const [pdfSummary, setPdfSummary] = useState('');

    const uploadPdf = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:8000/process-pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.summary) {
                setPdfSummary(response.data.summary);
            } else {
                setPdfSummary('PDF 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error processing PDF:', error);
            setPdfSummary('PDF 처리 중 오류가 발생했습니다.');
        }
    };

    return (

        <div className="pdf">
            <div className="pdf-section">
                <h2>PDF 문서 요약</h2>
                <label htmlFor="pdf-upload" className="pdf-upload-label">
                    PDF 업로드
                </label>
                <input
                    id="pdf-upload"
                    type="file"
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            uploadPdf(file);
                        }
                    }}
                />
                {pdfSummary && (
                    <div className="pdf-summary">
                        <h3>요약 결과:</h3>
                        <p>{pdfSummary}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PdfSummary;