import OpenAIApi from 'openai';
import { DateTime } from 'luxon';
import 'dotenv/config'

const configuration = {
    organization: process.env.OPENAI_ORG_ID,
    apiKey: process.env.OPENAI_API_KEY,
};

export const makeItinerary = async (city, departure, comeback) => {
  const dt_departure = DateTime.fromJSDate(new Date(departure));
  const dt_comeback = DateTime.fromJSDate(new Date(comeback));

  const content = `
  Crie um itinerário resumido para uma viagem em ${city}
  indo ${dt_departure.toISODate()}, voltando ${dt_comeback.toISODate()}
  e que o texto de output possa ser usado em um site de viagens
  `;

  const openai = new OpenAIApi(configuration);
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{
      role: 'user',
      content,
    }]
  });
  
  console.log(response.choices[0].message.content.replace(/\n/g, ""));
  return response.choices[0].message.content.replace(/(\r\n|\n|\r)/gm, "<br>");
}