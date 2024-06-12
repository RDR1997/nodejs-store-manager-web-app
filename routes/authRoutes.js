const { Router } = require('express');
const authController = require('../controllers/authController')
const requireAuth = require('../middleware/requrieAuth')
const router = Router();

router.get('/signup', authController.singup_get);
router.post('/signup', authController.singup_post);
router.get('/login', authController.login_get);
router.post('/login', authController.login_post);
router.get('/text', requireAuth, authController.test);
// router.get('/signup', () => { });


module.exports = router;