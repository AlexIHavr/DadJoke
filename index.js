import https from 'https';
import fs from 'fs';

const leaderboard = process.argv[2] === '--leaderboard';
const searchTerm = process.argv[2] === '--searchTerm' ? process.argv[3] : undefined;

let allJokes;
try {
  allJokes = JSON.parse(fs.readFileSync('./jokes.json'));
} catch (e) {
  allJokes = [];
}

if (leaderboard) {
  console.log(getLeaderboardJoke());
  process.exit();
}

if (searchTerm === undefined) {
  throw new Error('Enter, please, searchTerm argument.');
}

const options = {
  host: 'icanhazdadjoke.com',
  path: `/search?term=${searchTerm}`,
  method: 'GET',
  headers: {
    Accept: 'application/json',
  },
};

https
  .get(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(getRandomJoke(data));
    });
  })
  .on('error', (e) => {
    throw new Error(e.message);
  });

function getLeaderboardJoke() {
  if (!allJokes.length) return 'jokes.json has no jokes.';
  return allJokes.sort((a, b) => b.count - a.count)[0].joke;
}

function getRandomJoke(data) {
  const jokes = JSON.parse(data).results;

  if (!jokes.length) return 'No jokes were found for that search term';

  const randomJoke = jokes[getRandomNumber(0, jokes.length - 1)];

  const indexExistJoke = allJokes.findIndex(({ id }) => id === randomJoke.id);
  if (indexExistJoke !== -1) {
    allJokes[indexExistJoke].count += 1;
  } else {
    allJokes.push({ ...randomJoke, count: 1 });
  }

  fs.writeFileSync('./jokes.json', JSON.stringify(allJokes));

  return randomJoke.joke;
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
