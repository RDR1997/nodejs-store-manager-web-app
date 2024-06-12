const { Router } = require('express');
const productController = require('../controllers/productController')
const requireAuth = require('../middleware/requrieAuth')
const router = Router();

router.post('/', requireAuth, productController.product_post);
router.get('/', requireAuth, productController.product_get);
router.get('/get-single-product/:product_id', requireAuth, productController.singleProduct_get);
router.put('/', requireAuth, productController.product_put);
router.put('/', requireAuth, productController.product_put);
router.delete('/:product_id', requireAuth, productController.product_delete);

router.post('/product-images', requireAuth, productController.product_images_post);
router.get('/product-images/:product_id', requireAuth, productController.product_images_get);
router.delete('/product-images/:product_id', requireAuth, productController.product_images_delete);


// generate barcode
// Add images
// fetch images
// delete images




module.exports = router;