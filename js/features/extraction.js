// js/features/extraction.js

const clinicalExtractionSchema = {
    type: "OBJECT",
    properties: {
        oneLiner: {
            type: "STRING",
            description: "A concise 10-15 word sentence summarizing the document type and core clinical result (e.g., 'Pap Smear Report: Normal cervical cytology with no malignancy.')."
        },
        executiveSummary: { 
            type: "STRING", 
            description: "A brief human-readable summary of the document." 
        },
        criticalAlerts: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "List of critical or out-of-range values."
        },
        laboratoryValues: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    testName: { type: "STRING" },
                    result: { type: "STRING" },
                    unit: { type: "STRING" },
                    referenceRange: { type: "STRING" },
                    flag: { type: "STRING" }
                }
            }
        },
        medications: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING" },
                    dosage: { type: "STRING" }
                }
            }
        },
        diagnoses: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    condition: { type: "STRING" },
                    status: { type: "STRING" }
                }
            }
        },
        vitalSigns: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    measurement: { type: "STRING" },
                    value: { type: "STRING" },
                    unit: { type: "STRING" }
                }
            }
        },
        procedures: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    procedureName: { type: "STRING" },
                    date: { type: "STRING" }
                }
            }
        }
    }
};

export async function processMedicalDocument(base64ImageString) {
    const extractedMimeType = base64ImageString.substring(base64ImageString.indexOf(":") + 1, base64ImageString.indexOf(";"));
    const cleanBase64 = base64ImageString.split(',')[1] || base64ImageString;
    
    const bridgeURL = "https://gemini-bridge.abijah-keru.workers.dev/"; 
    
    const prompt = "You are an expert medical data extractor. Analyze this document. First, generate a concise 'oneLiner' summarizing the document type and primary clinical finding. Second, write a brief executive summary and critical alerts. Finally, extract all raw laboratory values, medications, diagnoses, vital signs, and procedures exactly as written.";

    try {
        const response = await fetch(bridgeURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                base64ImageString: cleanBase64,
                mimeType: extractedMimeType,
                promptText: prompt,
                customSchema: clinicalExtractionSchema
            })
        });
        
        if (!response.ok) throw new Error('Bridge connection failed');

        const result = await response.json();
        
        if (result.error) {
            console.error("Gemini API Error:", result.error.message);
            return null;
        }

        const extractedJsonString = result.candidates[0].content.parts[0].text;
        const structuredData = JSON.parse(extractedJsonString);
        
        return structuredData;
        
    } catch (error) {
        console.error("AI Extraction Error:", error);
        return null;
    }
}