// utils/fileManager.js - Dosya yönetimi ve kaydetme
import fs from "fs";
import path from "path";

export class FileManager {
  constructor(domain) {
    this.domain = domain.replace(/[^a-zA-Z0-9]/g, "_"); // Dosya adı için güvenli hale getir
    this.resultsDir = "results";
    this.ensureResultsDir();
  }

  ensureResultsDir() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  async saveEndpoints(endpointResults, formInfo = []) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const filename = `${this.domain}_endpoints_${timestamp}.txt`;
    const filepath = path.join(this.resultsDir, filename);

    let content = "";
    content += "# API ENDPOINT DISCOVERY RESULTS\n";
    content += `# Domain: ${this.domain.replace(/_/g, ".")}\n`;
    content += `# Scan Date: ${new Date().toLocaleString()}\n`;
    content += `# Total Endpoints: ${endpointResults.length}\n`;
    content += "#" + "=".repeat(80) + "\n\n";

    // Header
    content += "URL\tMETHOD\tAUTH_STATUS\tHAS_FORM\tFORM_PARAMS\tSTATUS_CODE\n";
    content += "-".repeat(120) + "\n";

    // Process endpoints
    endpointResults.forEach((result) => {
      const parsed = this.parseEndpointResult(result, formInfo);
      content += `${parsed.url}\t${parsed.method}\t${parsed.authStatus}\t${parsed.hasForm}\t${parsed.formParams}\t${parsed.statusCode}\n`;
    });

    // Summary
    content += "\n" + "=".repeat(80) + "\n";
    content += "# SUMMARY\n";
    content += "=".repeat(80) + "\n";

    const authRequired = endpointResults.filter((r) =>
      r.includes("AUTH REQUIRED")
    ).length;
    const noAuth = endpointResults.filter((r) => r.includes("NOAUTH")).length;
    const withForms = formInfo.length;

    content += `Total Endpoints: ${endpointResults.length}\n`;
    content += `Auth Required: ${authRequired}\n`;
    content += `No Auth Required: ${noAuth}\n`;
    content += `Forms Found: ${withForms}\n`;

    // Form details
    if (formInfo.length > 0) {
      content += "\n# FORM DETAILS\n";
      content += "-".repeat(80) + "\n";
      formInfo.forEach((form, index) => {
        content += `Form ${index + 1}: ${form.action} (${form.method})\n`;
        content += `  Parameters: ${form.params.join(", ")}\n`;
      });
    }

    try {
      fs.writeFileSync(filepath, content, "utf8");
      return filepath;
    } catch (error) {
      console.error("Dosya kaydetme hatası:", error);
      return null;
    }
  }

  parseEndpointResult(result, formInfo) {
    // Format: "URL - AUTH_STATUS - METHOD - STATUS: code"
    const parts = result.split(" - ");

    const url = parts[0] || "";
    const authStatus = parts[1] || "UNKNOWN";
    const method = parts[2] || "GET";

    // Status code'u çıkar
    let statusCode = "N/A";
    const statusMatch = result.match(/Status: (\d+)/);
    if (statusMatch) {
      statusCode = statusMatch[1];
    }

    // Form varlığını kontrol et
    const relatedForm = formInfo.find(
      (form) => url.includes(form.action) || form.action.includes(url)
    );

    const hasForm = relatedForm ? "YES" : "NO";
    const formParams = relatedForm ? relatedForm.params.join("|") : "N/A";

    return {
      url: url.trim(),
      method: method.trim(),
      authStatus: authStatus.trim(),
      hasForm,
      formParams,
      statusCode,
    };
  }

  async saveJsonReport(endpointResults, formInfo, visitedPages) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const filename = `${this.domain}_report_${timestamp}.json`;
    const filepath = path.join(this.resultsDir, filename);

    const report = {
      domain: this.domain.replace(/_/g, "."),
      scanDate: new Date().toISOString(),
      summary: {
        totalEndpoints: endpointResults.length,
        authRequired: endpointResults.filter((r) => r.includes("AUTH REQUIRED"))
          .length,
        noAuth: endpointResults.filter((r) => r.includes("NOAUTH")).length,
        pagesScanned: visitedPages.size,
        formsFound: formInfo.length,
      },
      endpoints: endpointResults.map((result) =>
        this.parseEndpointResult(result, formInfo)
      ),
      forms: formInfo,
      visitedPages: Array.from(visitedPages),
    };

    try {
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2), "utf8");
      return filepath;
    } catch (error) {
      console.error("JSON rapor kaydetme hatası:", error);
      return null;
    }
  }
}
