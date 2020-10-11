import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import { ALL_BOOKS } from '../queries'

const Books = (props) => {
  
  const [genre, setGenre] = useState(null)
  const result = useQuery(ALL_BOOKS, {
    variables: {genre: genre},
    fetchPolicy: "cache-and-network"

  })
  const allBooksRes = useQuery(ALL_BOOKS)

  if (!props.show) {
    return null
  }
  if (result.loading || allBooksRes.loading) {
    return <div>loading...</div>
  }
  const books = result.data.allBooks
  const allBooks = allBooksRes.data.allBooks
  let genres = allBooks.map(book => book.genres).flat()
  genres = [...new Set(genres)]
  
  return (
    <div>
      <h2>books</h2>
      {genre ? <div>in genre <b>{genre}</b></div> : null}
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              author
            </th>
            <th>
              published
            </th>
          </tr>
          {books.map(a =>
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          )}
        </tbody>
      </table>
      {genres.map(g =>
        <button onClick={() => setGenre(g)}>{g}</button>
      )}
      <button onClick={() => setGenre(null)}>all genres</button>
    </div>
  )
}

export default Books