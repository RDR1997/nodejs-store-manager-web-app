const { Router } = require('express');
const orderController = require('../controllers/orderController')
const requireAuth = require('../middleware/requrieAuth')
const router = Router();

router.post('/order-bill', requireAuth, orderController.orderBill_post);
// router.get('/', requireAuth, orderController.product_get);


module.exports = router;