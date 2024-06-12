const { Router } = require('express');
const userController = require('../controllers/userController')
const requireAuth = require('../middleware/requrieAuth')
const router = Router();

router.get('/', requireAuth, userController.user_get);

module.exports = router;