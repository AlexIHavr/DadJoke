import https from 'https';
import fs from 'fs';

const searchTerm = process.argv[2];
const leaderboard = process.argv[3];

const options = {
  host: 'icanhazdadjoke.com',
  path: `/search?term=${searchTerm}`,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

const getJokes = (data) => {
  const jokes = JSON.parse(data).results;

  if (!jokes.length) return console.log('No jokes were found for that search term');

  const randomJoke = jokes[getRandomNumber(0, jokes.length - 1)];

  const allJokes = JSON.parse(fs.readFileSync('./jokes.json'));

  if (leaderboard) {
    console.log(allJokes.sort((a, b) => a.count - b.count).slice(-1));
    return;
  }

  const indexExistJoke = allJokes.findIndex(({ id }) => id === randomJoke.id);
  if (indexExistJoke !== -1) {
    allJokes[indexExistJoke].count += 1;
  } else {
    allJokes.push({ ...randomJoke, count: 1 });
  }

  fs.writeFileSync('./jokes.json', JSON.stringify(allJokes));

  console.log(randomJoke);
};

https
  .get(options, (res) => {
    let body = '';

    res.on('data', (data) => {
      body += data;
    });

    res.on('end', () => {
      getJokes(body);
    });
  })
  .on('error', (e) => {
    console.error(e);
  });

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
