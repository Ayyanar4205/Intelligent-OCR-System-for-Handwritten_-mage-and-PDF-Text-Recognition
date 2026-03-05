import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function performOCR(fileData: string, mimeType: string, isHandwriting: boolean = false): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const prompt = isHandwriting 
    ? "Transcribe the handwritten text in this image. Only return the transcribed text, nothing else."
    : "Extract all text from this document/image accurately. Maintain the layout structure where possible. Only return the extracted text.";

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: fileData.split(',')[1] || fileData,
                mimeType: mimeType
              }
            }
          ]
        }
      ]
    });

    return response.text || "No text detected.";
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to process document. Please ensure your API key is valid and the file is supported.");
  }
}
