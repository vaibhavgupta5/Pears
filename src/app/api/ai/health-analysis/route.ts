import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { healthMetrics } = body;

    if (!healthMetrics || !Array.isArray(healthMetrics)) {
      return NextResponse.json(
        { message: 'Health metrics data is required and must be an array.' },
        { status: 400 }
      );
    }

    // Generate the prompt for Cohere
    const prompt = `Analyze the following health vitals and provide a concise assessment within 150 characters for each entry. Include possible health conditions or diseases. Format the response with HTML tags for readability. Use bold headings for key metrics and separate each heading with a line break. Provide actionable recommendations alongside your analysis. Ensure the entire response remains clear, structured, and compact\n\n${healthMetrics.map((metric, index) => 
      `Entry ${index + 1}:\nHeart Rate: ${metric.heart_rate || 'N/A'} bpm\nBlood Pressure: ${metric.blood_pressure?.systolic || 'N/A'}/${metric.blood_pressure?.diastolic || 'N/A'} mmHg\nOxygen Saturation: ${metric.oxygen_saturation || 'N/A'}%\nRespiratory Rate: ${metric.respiratory_rate || 'N/A'} breaths/min\nTemperature: ${metric.temperature || 'N/A'}°F\nDate: ${metric.updated_at}\n\n`
    ).join('')}Summarize the analysis for each entry with actionable insights and suggestions for potential improvement. Write down all vital count and write if it is ideal or not. Do not seperate by entries count. do not exceed 150 characters in total. Add a last section of summary and recommendation add them to strong tag too. Use Strong tag for bold and <br> for next line. `;

    // Send request to Cohere API
    const response = await axios.post(
      'https://api.cohere.ai/v1/generate', // Cohere's text generation endpoint
      {
        model: 'command-r-plus-08-2024', // Use the appropriate model (check Cohere documentation)
        prompt: prompt,
        max_tokens: 500, // Specify token limit
        temperature: 0.7, // Adjust temperature for creativity
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`, // Use your Cohere API key
        },
      }
    );

    // Extract the generated text
    const result = response.data.generations[0].text;

    return NextResponse.json({ result }, { status: 200 });
  } catch (error: any) {
    console.error("Cohere API Error:", error.response?.data || error.message);
    return NextResponse.json(
      { message: 'Failed to analyze health vitals', error: error.response?.data || error.message },
      { status: 500 }
    );
  }
}
