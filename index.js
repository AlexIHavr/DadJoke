import https from 'https';
import fs from 'fs';

class DadJokeAPI {
  constructor() {
    this.leaderboard = process.argv[2] === '--leaderboard';
    this.setOptions();
    this.setAllJokes();
  }

  async getDadJoke() {
    if (this.leaderboard) {
      return this.getLeaderboardJoke();
    }

    return await this.getSearchTermJoke(this.options);
  }

  setOptions() {
    if (this.leaderboard) return;

    const searchTerm = process.argv[2] === '--searchTerm' ? process.argv[3] : undefined;

    if (searchTerm === undefined) {
      throw new Error('Enter, please, searchTerm argument.');
    }

    this.options = {
      host: 'icanhazdadjoke.com',
      path: `/search?term=${searchTerm}`,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    };
  }

  setAllJokes() {
    try {
      this.allJokes = JSON.parse(fs.readFileSync('./jokes.json'));
    } catch (e) {
      this.allJokes = [];
    }
  }

  getLeaderboardJoke() {
    if (!this.allJokes.length) return 'jokes.json has no jokes.';
    return this.allJokes.sort((a, b) => b.count - a.count)[0].joke;
  }

  async getSearchTermJoke(options) {
    return new Promise((resolve, reject) => {
      https
        .get(options, (res) => {
          this.data = '';

          res.on('data', (chunk) => {
            this.data += chunk;
          });

          res.on('end', () => {
            resolve(this.getRandomJoke());
          });
        })
        .on('error', (e) => {
          throw new Error(e.message);
        });
    });
  }

  getRandomJoke() {
    const jokes = JSON.parse(this.data).results;

    if (!jokes.length) return 'No jokes were found for that search term';

    const randomJoke = jokes[this.getRandomNumber(0, jokes.length - 1)];

    const indexExistJoke = this.allJokes.findIndex(({ id }) => id === randomJoke.id);
    if (indexExistJoke !== -1) {
      this.allJokes[indexExistJoke].count += 1;
    } else {
      this.allJokes.push({ ...randomJoke, count: 1 });
    }

    fs.writeFileSync('./jokes.json', JSON.stringify(this.allJokes));

    return randomJoke.joke;
  }

  getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

const dadJokeAPI = new DadJokeAPI();

(async function () {
  console.log(await dadJokeAPI.getDadJoke());
})();
