
import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import { ALL_AUTHORS, EDIT_AUTHOR } from '../queries'
import { useMutation } from '@apollo/client'




const Authors = (props) => {
  const result = useQuery(ALL_AUTHORS)
  if (!props.show) {
    return null
  }
  if (result.loading) {
    return <div>loading...</div>
  }
  const authors = result.data.allAuthors

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              born
            </th>
            <th>
              books
            </th>
          </tr>
          {authors.map(a =>
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          )}
        </tbody>
      </table>
    <SetBirthyear authors={authors} token={props.token}/>
    </div>
  )
}

const SetBirthyear = (props) => {
  const [name, setName] = useState('')
  const [born, setBorn] = useState('')

  const [changeAuthor] = useMutation(EDIT_AUTHOR)

  const submit = async (event) => {
    event.preventDefault()
    const bornInt = Number(born)
    changeAuthor({ variables: { name, setBornTo: bornInt } })

    setName('')
    setBorn('')
  }

  const handleChange = ({target}) => {
    setName(target.value)
  }

  const authors = props.authors
  if (!props.token)
    return null
  return (
    <div>
      <h2>Set birthyear</h2>

      <form onSubmit={submit}>
        <div>
          <select value={name} onChange={handleChange}>
            {authors.map(a => <option value={a.name}>{a.name}</option> )}

          </select>
        </div>
        <div>
          born <input
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button type='submit'>update author</button>
      </form>
    </div>
  )
}

export default Authors
