import * as React from 'react';
import useSwr from 'swr';
import { getGenres, getMovies } from './api/movies';

const callFn = (method, ...params) => method(...params);

export default function Movies() {
  const [genre, setGenre] = React.useState('');
  const genres = useSwr([getGenres], callFn);
  const movies = useSwr([getMovies, genre], callFn);
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
