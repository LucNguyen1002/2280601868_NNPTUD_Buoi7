var express = require('express');
var router = express.Router();
let { checkLogin, checkRole } = require('../utils/authHandler')
let cartModel = require('../schemas/cart')

router.get('/', checkLogin, async function (req, res, next) {
    try {
        let userId = req.userId;
        let currentCart = await cartModel.findOne({
            user: userId
        });
        if (!currentCart) {
            return res.status(404).send({ message: "Cart not found" });
        }
        res.send(currentCart.items)
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
})
router.post('/add-items', checkLogin, async function (req, res, next) {
    try {
        let userId = req.userId;
        let { product, quantity } = req.body;
        let currentCart = await cartModel.findOne({
            user: userId
        });
        if (!currentCart) {
            return res.status(404).send({ message: "Cart not found" });
        }
        let index = currentCart.items.findIndex(
            function (e) {
                return e.product == product;
            }
        )
        if (index < 0) {
            currentCart.items.push({
                product: product,
                quantity: quantity
            });
        } else {
            currentCart.items[index].quantity += quantity
        }
        await currentCart.save()
        res.send(currentCart)
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
})
router.post('/decrease-items', checkLogin, async function (req, res, next) {
    try {
        let userId = req.userId;
        let { product, quantity } = req.body;
        let currentCart = await cartModel.findOne({
            user: userId
        });
        if (!currentCart) {
            return res.status(404).send({ message: "Cart not found" });
        }
        let index = currentCart.items.findIndex(
            function (e) {
                return e.product == product;
            }
        )
        if (index < 0) {
            return res.status(404).send({ message: "Product not found in cart" });
        } else {
            if (currentCart.items[index].quantity > quantity) {
                currentCart.items[index].quantity -= quantity
            } else {
                currentCart.items.splice(index, 1)
            }
        }
        await currentCart.save()
        res.send(currentCart)
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
})

module.exports = router;