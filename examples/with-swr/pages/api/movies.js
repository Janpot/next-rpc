export const config = { rpc: true };

const LATENCY = 500;

const delay = async (ms) => new Promise((r) => setTimeout(r, ms));

const flat = (arrays) => [].concat(...arrays);

const movies = {
  action: [
    { title: 'Die Hard', year: 1988 },
    { title: 'Terminator', year: 1984 },
    { title: 'Raiders of the Loast Ark', year: 1981 },
  ],
  thriller: [
    { title: 'The Silence of the Lambs', year: 1991 },
    { title: 'The Sixth Sense', year: 1999 },
    { title: 'American Psycho', year: 2000 },
  ],
  animation: [
    { title: 'Toy Story', year: 1995 },
    { title: 'WALL-E', year: 2008 },
    { title: 'Frozen', year: 2013 },
  ],
};

export async function getGenres() {
  await delay(LATENCY);
  return Object.keys(movies);
}

export async function getMovies(genre) {
  await delay(LATENCY);
  return movies[genre] || flat(Object.values(movies));
}
