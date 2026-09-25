/* global React, window */

import React, { useState } from "react";

const { MIcon } = window;

/* =========================================================
   GENERATE RETURN LABELS ONLY
   ========================================================= */

function Generatelables() {
  const [returnLabelQuantity, setReturnLabelQuantity] = useState("");
  const [labelGenerating, setLabelGenerating] = useState(false);

  const loadJsPDF = () => {
    return new Promise((resolve, reject) => {
      if (window.jspdf?.jsPDF) {
        resolve(window.jspdf.jsPDF);
        return;
      }

      const existingScript = document.querySelector(
        'script[data-wealthoria-jspdf="true"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (window.jspdf?.jsPDF) {
            resolve(window.jspdf.jsPDF);
          } else {
            reject(new Error("jsPDF loaded but was not available."));
          }
        });

        existingScript.addEventListener("error", () => {
          reject(new Error("Unable to load jsPDF."));
        });

        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

      script.async = true;
      script.dataset.wealthoriaJspdf = "true";

      script.onload = () => {
        if (window.jspdf?.jsPDF) {
          resolve(window.jspdf.jsPDF);
        } else {
          reject(new Error("jsPDF loaded but was not available."));
        }
      };

      script.onerror = () => {
        reject(new Error("Unable to load jsPDF."));
      };

      document.head.appendChild(script);
    });
  };

  const generateReturnAddressLabelsPDF = async () => {
    if (labelGenerating) return;

    const quantity = Number(returnLabelQuantity);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      alert("Please enter a valid number of labels.");
      return;
    }

    try {
      setLabelGenerating(true);

      const confirmed = window.confirm(
        `Generate ${quantity} return address label${
          quantity === 1 ? "" : "s"
        }?`
      );

      if (!confirmed) return;

      const jsPDF = await loadJsPDF();

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = 210;
      const pageHeight = 297;

      // Compact label matching the requested reference.
      const columns = 7;
      const rows = 22;
      const labelsPerPage = columns * rows;

      const labelWidth = 25;
      const labelHeight = 9.55;

      // Small cutting gap between labels.
      const gapX = 2;
      const gapY = 1.5;

      const totalWidth =
        columns * labelWidth + (columns - 1) * gapX;

      const totalHeight =
        rows * labelHeight + (rows - 1) * gapY;

      const marginX = (pageWidth - totalWidth) / 2;
      const marginY = (pageHeight - totalHeight) / 2;

      for (let index = 0; index < quantity; index += 1) {
        const position = index % labelsPerPage;

        if (index > 0 && position === 0) {
          pdf.addPage();
        }

        const column = position % columns;
        const row = Math.floor(position / columns);

        const x =
          marginX + column * (labelWidth + gapX);

        const y =
          marginY + row * (labelHeight + gapY);

        // ONE small padding for the whole label.
        const padding = 1.2;
        const left = x + padding;
        const right = x + labelWidth - padding;

        // Label border
        pdf.setDrawColor(145, 145, 145);
        pdf.setLineWidth(0.16);
        pdf.setLineDashPattern([1.0, 1.0], 0);
        pdf.rect(x, y, labelWidth, labelHeight);
        pdf.setLineDashPattern([], 0);

        // Tiny company title
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(2.15);
        pdf.text(
          "WEALTHORIA EDUCATION PRIVATE LIMITED",
          left,
          y + 2.0
        );

        // Divider
        pdf.setDrawColor(100, 100, 100);
        pdf.setLineWidth(0.10);
        pdf.line(left, y + 2.65, right, y + 2.65);

        // Return message
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(1.95);
        pdf.text(
          "IF UNDELIVERED, PLEASE RETURN TO:",
          left,
          y + 3.85
        );

        // Address — exactly two lines
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(2.05);

        pdf.text(
          "No.2687/1, D-1, 2nd Floor, 5th Cross,",
          left,
          y + 5.45
        );

        pdf.text(
          "Kalidasa Road, V V Mohalla, Mysore - 570002",
          left,
          y + 6.95
        );

        // Phone — immediately after address, with tiny bottom padding
        pdf.text(
          "Phone: 9019759001",
          left,
          y + 8.35
        );
      }

      const today = new Date()
        .toISOString()
        .slice(0, 10);

      pdf.save(
        `wealthoria-return-address-labels-${quantity}-${today}.pdf`
      );

      alert(
        `${quantity} return address label${
          quantity === 1 ? "" : "s"
        } generated successfully.`
      );
    } catch (error) {
      console.error(
        "Return address label PDF error:",
        error
      );

      alert(
        error?.message ||
          "Unable to generate the return address labels. Please try again."
      );
    } finally {
      setLabelGenerating(false);
    }
  };

  return (
    <div
      className="admin-page"
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "16px 0 24px"
      }}
    >
      <div
        style={{
          border: "1px solid #e8ebef",
          borderRadius: 10,
          background: "#fff",
          padding: 16,
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                lineHeight: 1.2,
                fontWeight: 750,
                letterSpacing: "-.02em"
              }}
            >
              Generate Labels
            </h2>

            <div
              style={{
                marginTop: 3,
                fontSize: 11,
                color: "#667085"
              }}
            >
              Return address labels · 132 compact labels per A4
            </div>
          </div>

          {MIcon && (
            <MIcon
              name="print"
              size={18}
            />
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%"
          }}
        >
          <input
            type="number"
            min="1"
            step="1"
            value={returnLabelQuantity}
            onChange={(e) =>
              setReturnLabelQuantity(e.target.value)
            }
            placeholder="Number of labels"
            aria-label="Number of return address labels"
            style={{
              flex: 1,
              minWidth: 0,
              height: 36,
              padding: "0 10px",
              border: "1px solid #d0d5dd",
              borderRadius: 8,
              outline: "none",
              fontSize: 12,
              fontWeight: 600,
              color: "#344054",
              boxSizing: "border-box"
            }}
          />

          <button
            type="button"
            onClick={generateReturnAddressLabelsPDF}
            disabled={
              labelGenerating ||
              !returnLabelQuantity ||
              Number(returnLabelQuantity) <= 0
            }
            style={{
              height: 36,
              padding: "0 14px",
              border: "none",
              borderRadius: 8,
              background:
                labelGenerating ||
                !returnLabelQuantity ||
                Number(returnLabelQuantity) <= 0
                  ? "#d0d5dd"
                  : "rgb(232 95 78)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              cursor:
                labelGenerating ||
                !returnLabelQuantity ||
                Number(returnLabelQuantity) <= 0
                  ? "not-allowed"
                  : "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {labelGenerating
              ? "Generating..."
              : "Generate Labels"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   GLOBAL ADMIN EXPORT
========================================================= */

window.AdminGeneratelables = Generatelables;

export default Generatelables;
