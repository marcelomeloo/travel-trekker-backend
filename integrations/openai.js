import OpenAIApi from "openai";
import { DateTime } from "luxon";
import "dotenv/config";

const configuration = {
  organization: process.env.OPENAI_ORG_ID,
  apiKey: process.env.OPENAI_API_KEY,
};

export const makeItinerary = async (city, departure, comeback) => {
  const dt_departure = new Date(departure);
  const dt_comeback = comeback ?new Date(comeback) : undefined;

  const content = `
  Crie um itinerário resumido para uma viagem em ${city}
  indo ${dt_departure?.toISOString().slice(0, 10)}${
    dt_comeback ? `, voltando ${dt_comeback.toISOString().slice(0, 10)}` : ""
  }e que o texto de output possa ser usado em um site de viagens
  `;

  const openai = new OpenAIApi(configuration);
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content,
      },
    ],
  });
  return response.choices[0].message.content;
};
