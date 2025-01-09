import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import * as nanoid from "nanoid"
import bodyParser from 'body-parser'

dotenv.config()
const app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
mongoose.connect(process.env.MONGODB_URL)

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html')
});

/**
 * 1. Debes proporcionar tu propio proyecto, no la URL ejemplo.
 * 2. Puedes hacer una petición POST a /api/users con los datos
 *  de formulario que tenga la propiedad username para crear un nuevo usuario.
 * 3. La respuesta devuelta de POST /api/users con datos de formulario
 *  username será un objeto con propiedades username y _id.
 * 4. Puedes hacer una petición GET a /api/users para obtener una lista con
 *  todos los usuarios.
 * 5. La petición GET a /api/users devuelve un arreglo.
 * 6. Each element in the array returned from GET /api/users is an object literal
 *  containing a user's username and _id.
 * 7. You can POST to /api/users/:_id/exercises with form data description, duration,
 *  and optionally date. If no date is supplied, the current date will be used.
 * 8. The response returned from POST /api/users/:_id/exercises will be the user
 *  object with the exercise fields added.
 * 9. You can make a GET request to /api/users/:_id/logs to retrieve a full exercise
 *  log of any user.
 * 10. Una solicitud al log del usuario GET /api/users/:_id/logs devuelve un objeto
 *  de usuario con una propiedad count representando el número de ejercicios que
 *  pertenecen a ese usuario.
 * 11. Una solicitud GET a /api/users/:_id/logs devolverá el objeto de usuario con un
 *  arreglo log de todos los ejercicios añadidos.
 * 12. Cada elemento en el arreglo log que es devuelto desde GET /api/users/:_id/logs
 *  es un objeto que debe tener las propiedades description, duration y date.
 * 13. La propiedad description de cualquier objeto en el arreglo log que es devuelto
 *  desde GET /api/users/:_id/logs debe ser una cadena.
 * 14. La propiedad duration de cualquier objeto en el arreglo log que es devuelto
 *  desde GET /api/users/:_id/logs debe ser un número.
 * 15. La propiedad date de cualquier objeto en el arreglo log que es devuelto
 *  desde GET /api/users/:_id/logs debe ser una cadena. Utiliza el formato dateString
 *  de la API Date.
 * 16. Puedes añadir parámetros from, to y limit a una petición GET /api/users/:_id/logs
 *  para recuperar parte del log de cualquier usuario. from and to are dates
 *  in yyyy-mm-dd format. limit es un número entero de cuántos logs hay que devolver.
*/

import userModel from "./model/User.js"
import exerciseModel from "./model/Exercise.js"

// Crear un nuevo usuario
app.post(
  "/api/users",
  async (request, response, next) => {
    let userName = request.body.username
    let id = nanoid.nanoid(24).toString()
    if (userName) {
      try {
        let existingUser = await userModel.findOne({ username: userName })
        if (existingUser) {
          return response.status(400).json({ error: "Usuario ya existe" })
        }

        let user = new userModel({
          username: userName,
          _id: id
        })

        await user.save()

        response.json({
          username: userName, _id: id
        })
      } catch (error) {
        next(error)
      }
    } else {
      response.status(400).json({ error: "Nombre de usuario es requerido" })
    }
  }
)

app.get(
  "/api/users",
  (request, response) => {
    let users = userModel.find()

    users.then((user) => {
      response.json(user);
    })
  }
)

// Añadir un ejercicio a un usuario existente
app.post(
  "/api/users/:_id/exercises",
  async (request, response, next) => {
    let userId = request.params._id
    let user = await userModel.findById(userId)

    if (user) {
      let id = nanoid.nanoid(24).toString()
      let exerciseData = {
        _id: id,
        username: user.username,
        description: request.body.description,
        duration: parseInt(request.body.duration),
        date: request.body.date ? new Date(request.body.date) : new Date()
      }
      await new exerciseModel(exerciseData).save()
      exerciseData.date = exerciseData.date.toDateString()
      response.json({
        _id: userId,
        username: user.username,
        description: exerciseData.description,
        duration: exerciseData.duration,
        date: exerciseData.date
      })
    } else {
      response.status(404).json({ error: "Usuario no encontrado" })
    }
    next()
  }
)

app.get(
  "/api/users/:_id/logs",
  async (request, response) => {
    let userId = request.params._id
    let from = request.query.from ? new Date(request.query.from) : null
    let to = request.query.to ? new Date(request.query.to) : null
    let limit = parseInt(request.query.limit) || null

    try {
      let user = await userModel.findById(userId)
      if (user) {
        let query = {
          username: user.username
        }

        if (from || to) {
          query.date = {}
          if (from) query.date.$gte = from
          if (to) query.date.$lte = to
        }

        let exercises = await exerciseModel.find(query).limit(limit)

        exercises = exercises.map(exercise => {
          return {
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toDateString()
          }
        })

        response.json({
          username: user.username,
          count: exercises.length,
          log: exercises
        })
      } else {
        response.status(404).json({ error: "Usuario no encontrado" })
      }
    } catch (error) {
      response.status(500).json({ error: "Error al obtener los logs" })
    }
  }
)

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
