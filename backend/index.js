const { ApolloServer, UserInputError, gql, AuthenticationError } = require('apollo-server')
const jwt = require('jsonwebtoken')

const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const { PubSub } = require('apollo-server')
const pubsub = new PubSub()


mongoose.set('useFindAndModify', false)

const MONGODB_URI = 'mongodb+srv://fullstack:halfstack@cluster0-ostce.mongodb.net/gql-library?retryWrites=true'
const localURI = 'mongodb://localhost:27017/fullstack'
const JWT_SECRET = 'NEED_HERE_A_SECRET_KEY'

mongoose.set('useCreateIndex', true)

console.log('connecting to', localURI)

mongoose.connect(localURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }


  type Author {
      name: String!
      born: Int
      id: ID!
      bookCount: Int!
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book

    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }

  type Subscription {
    bookAdded: Book!
  }    
`

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: (root, args) => {
      if (!args.author && !args.genre)
        return Book.find({}).populate('author')
      return Book.find({ genres: { $in: [args.genre] } }).populate('author')
    },
    allAuthors: async () => {

      const res = await Author.aggregate([{
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "author",
          as: "books"
        }
      }, {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          books: 1,
          born: 1,
          bookCount: { $size: "$books" }
        }
      }])
      console.log(res)
      return res
    },
    me: (root, args, context) => {
      return context.currentUser
    }
  },

  // Author: {
  //   bookCount: (root) => Book.countDocuments({ author: root._id })
  // },

  Mutation: {
    addBook: async (root, args, context) => {
      const { author, ...bookArgs } = { ...args }
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }
      let book
      try {
        const isAuthor = await Author.exists({ name: author })
        if (isAuthor) {
          const bookAuthor = await Author.findOne({ name: author })
          book = new Book({ ...bookArgs, author: bookAuthor._id })
        }
        else {
          newAuthor = new Author({ name: author })
          newAuthor = await newAuthor.save()
          book = new Book({ ...bookArgs, author: newAuthor._id })
        }
        await book.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }
      book = await Book.findById(book._id).populate('author')
      pubsub.publish('BOOK_ADDED', { bookAdded: book })

      return book
    },


    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser

      if (!currentUser) {
        throw new AuthenticationError("not authenticated")
      }
      const author = await Author.findOne({ name: args.name })
      if (!author)
        return null
      author.born = args.setBornTo
      try {
        await author.save()
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return author
    },
    createUser: (root, args) => {
      const user = new User({ ...args })

      return user.save()
        .catch(error => {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== 'secret') {
        throw new UserInputError("wrong credentials")
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return { value: jwt.sign(userForToken, JWT_SECRET) }
    }
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )

      const currentUser = await User.findById(decodedToken.id)

      return { currentUser }
    }
  }
})

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`)
  console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})
