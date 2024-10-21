export const handler = async (event, context) => {

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${event.queryStringParameters.lat}&lon=${event.queryStringParameters.lng}&units=imperial&appid=${process.env.OPEN_WEATHER_KEY}`;

  const data = await fetch(url);
  const json = await data.json();

  return {
    statusCode: 200,
    body: JSON.stringify(json)
  };
};

  