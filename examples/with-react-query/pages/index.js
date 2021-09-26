import * as React from 'react';
import { useQuery } from 'react-query';
import { getGenres, getMovies } from './api/movies';

export default function Movies() {
  const [genre, setGenre] = React.useState('');

  const genres = useQuery('getGenres', getGenres);
  const movies = useQuery(['getMovies', genre], () => getMovies(genre));

  return (
    <div>
      <div>
        <select
          disabled={!genres.data}
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">
            {genres.error
              ? 'error loading genres'
              : genres.data
              ? 'select a genre'
              : 'loading genres...'}
          </option>
          {genres.data
            ? genres.data.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))
            : null}
        </select>
        {movies.error
          ? 'error loading movies'
          : movies.data
          ? null
          : 'loading movies...'}
      </div>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Year</th>
          </tr>
        </thead>
        <tbody>
          {movies.data
            ? movies.data.map((movie) => (
                <tr key={movie.title}>
                  <td>{movie.title}</td>
                  <td>{movie.year}</td>
                </tr>
              ))
            : null}
        </tbody>
      </table>
    </div>
  );
}
