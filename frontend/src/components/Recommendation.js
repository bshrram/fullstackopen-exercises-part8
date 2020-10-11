import React, { useState, useEffect } from 'react'
import { useQuery,useLazyQuery } from '@apollo/client'
import { ALL_BOOKS, ME } from '../queries'

const Recommendation = (props) => {
  const userResult = useQuery(ME)
  const [getBooks, result] = useLazyQuery(ALL_BOOKS, {
    fetchPolicy: "cache-and-network"
  })
  const [books, setBooks] = useState([])
  const [genre, setGenre] = useState(null)
  
  useEffect(()=> {
    if (userResult.data){
      const user = userResult.data.me
      setGenre(user.favoriteGenre)
      const b = getBooks({variables: {genre: user.favoriteGenre}})
    }
  }, [userResult])

  useEffect(()=> {
    if(result.data)
      setBooks(result.data.allBooks)
  },[result])
  
  if (!props.show) {
    return null
  }

  
  if (userResult.loading || !books) {
    return <div>loading...</div>
  }

  return (
    <div>
      <h2>Recommendations</h2>
      {genre ? <div>books in your favorite genre <b>{genre}</b></div> : null}
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
    </div>
  )
}

export default Recommendation