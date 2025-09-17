import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: Request) {
  try { 
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return Response.json(
        { error: "Please provide a valid prompt for text generation." },
        { status: 400 }
      );
    }

    if (!process.env.LLM_MODEL) {
      return Response.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    const result = streamText({
      model: google(`models/${process.env.LLM_MODEL}`),
      prompt: prompt.trim(),
    });


    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error streaming text:", error);
    
    if (error instanceof Error && error.message.includes('quota')) {
      return Response.json(
        { error: "API quota exceeded. Please try again later." },
        { status: 429 }
      );
    }
    
    if (error instanceof Error && error.message.includes('authentication')) {
      return Response.json(
        { error: "Invalid API key. Please check your configuration." },
        { status: 401 }
      );
    }
    
    return Response.json(
      { 
        error: "Failed to stream text. Please try again later.",
        details: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}