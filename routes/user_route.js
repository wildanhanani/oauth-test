const express = require('express')
const userController = ('../controller/user')

const app = express()
const router = express.Router()

router.post('/user', userController.createuser)