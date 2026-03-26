import { GoogleGenAI, Type } from "@google/genai";
import { MapDataState, MapStyle, TitleSettings } from "../types";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export interface GenerationResult {
  mapData: MapDataState;
  mapStyle?: Partial<MapStyle>;
  titleSettings?: Partial<TitleSettings>;
}

const SYSTEM_INSTRUCTION = `
You are a data visualization assistant for MapViz AI. Your task is to generate global map data based on user prompts.
Return a JSON object with the following structure:
{
  "mapData": {
    "values": { "ISO_NUMERIC_CODE": NUMBER, ... },
    "metric": "NAME_OF_METRIC",
    "unit": "UNIT_OF_MEASURE"
  },
  "mapStyle": {
    "palette": "ocean" | "sunset" | "forest" | "monochrome",
    "classificationMethod": "equal" | "quantile" | "natural",
    "classesCount": number
  },
  "titleSettings": {
    "title": "MAIN_TITLE",
    "subtitle": "SUBTITLE"
  }
}
Use ISO 3166-1 numeric codes (3-digit strings) as keys for the values object.
Provide data for as many countries as possible (aim for 50+) to ensure a rich visualization.
Common ISO numeric codes: USA: "840", Canada: "124", China: "156", India: "356", Brazil: "076", Russia: "643", Australia: "036", Germany: "276", France: "250", UK: "826", Japan: "392", South Africa: "710", Italy: "380", Spain: "724", Mexico: "484", Argentina: "032", Indonesia: "360", Turkey: "792", Saudi Arabia: "682", South Korea: "410", Nigeria: "566", Egypt: "818".
For "GDP by country 2024", provide real GDP figures in USD (Trillions or Billions).
For "Population density global", provide people per sq km.
Ensure the JSON is valid and follows the schema exactly.
`;

export async function generateMapData(prompt: string): Promise<GenerationResult> {
  if (!apiKey) {
    throw new Error("Gemini API key is missing. Please configure it in the settings.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mapData: {
              type: Type.OBJECT,
              properties: {
                values: {
                  type: Type.OBJECT,
                  description: "ISO numeric codes as keys, numeric values as values",
                },
                metric: { type: Type.STRING },
                unit: { type: Type.STRING },
              },
              required: ["values", "metric", "unit"],
            },
            mapStyle: {
              type: Type.OBJECT,
              properties: {
                palette: { type: Type.STRING, enum: ["ocean", "sunset", "forest", "monochrome"] },
                classificationMethod: { type: Type.STRING, enum: ["equal", "quantile", "natural"] },
                classesCount: { type: Type.NUMBER },
              },
            },
            titleSettings: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
              },
            },
          },
          required: ["mapData"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as GenerationResult;
  } catch (error) {
    console.error("Error generating map data:", error);
    throw error;
  }
}
