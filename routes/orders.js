import express from 'express';
import Orders from '../models/orders.js';
import authChecker from "../middleware/authChecker.js";
import Items from "../models/items.js";
import {orderStatus, Roles as roles} from "../constants.js";

const router = express.Router();
9


router.get('/', async (req, res) => {
    const user = await authChecker(req, res);
    if (!user) {
        return res.status(403).send({error: 'User not logged in'});
    }
    try {
        const allOrders = await Orders.find();
        res.send(allOrders);
    } catch (err) {
        res.status(500).send({error: err.message});
    }
})

router.post('/create-order', async (req, res) => {
    const user = await authChecker(req, res);
    if (!user) {
        return res.status(401).send({error: 'You are not logged in!'});
    }

    const {itemId, quantity, orderId, postalAddress} = req.body;

    if (!itemId || !quantity) {
        return res.status(400).send({error: 'Item ID and quantity are required'});
    }

    const item = await Items.findById(itemId);
    if (!item) {
        return res.status(400).send({error: 'Item not found'});
    }

    const order = await Orders.findOne({_id: orderId, userId: user.id});
    const totalPrice = item.price * quantity;

    if (!order || order.status !== orderStatus.NONE) {
        if (!postalAddress) {
            return res.status(400).send({error: 'Postal address is required'});
        }

        const newOrder = await Orders.create({
            userId: user.id,
            items: [{itemId, quantity}],
            totalPrice,
            postalAddress
        });

        return res.status(200).send(newOrder);
    }

    const existingItemIndex = order.items.findIndex(i => i.itemId.toString() === itemId);
    if (existingItemIndex > -1) {
        order.items[existingItemIndex].quantity += quantity;
        order.totalPrice += totalPrice;
    } else {
        order.items.push({itemId, quantity});
        order.totalPrice += totalPrice;
    }

    await order.save();
    res.status(200).send(order);
});


router.patch("/remove-item", async (req, res) => {
    const user = await authChecker(req, res);
    if (!user) {
        return res.status(401).send({error: 'You are not logged in!'});
    }

    const {orderId, itemId} = req.body;
    if (!orderId || !itemId) {
        return res.status(400).send({error: 'Order ID and Item ID are required!'});
    }

    const order = await Orders.findOne({_id: orderId, userId: user.id});
    if (!order || order.status !== orderStatus.NONE) {
        return res.status(404).send({error: 'Order not found or cannot be modified'});
    }

    const itemInOrder = order.items.find(i => i.itemId.toString() === itemId);
    if (!itemInOrder) {
        return res.status(404).send({error: 'Item not found in order'});
    }

    const item = await Items.findById(itemId);
    if (!item) {
        return res.status(404).send({error: 'Item not found'});
    }

    if (itemInOrder.quantity > 1) {
        // Decrease quantity and total price
        itemInOrder.quantity -= 1;
        order.totalPrice -= item.price;
    } else {
        // Remove item from order
        order.items = order.items.filter(i => i.itemId.toString() !== itemId);
    }

    await order.save();

    // Delete order if it's empty
    if (order.items.length === 0) {
        await Orders.findByIdAndDelete(orderId);
        return res.status(200).send({message: 'Order deleted as it has no items left'});
    }

    res.status(200).send(order);
});


router.patch("/edit-postalAddress", async (req, res) => {
    const user = await authChecker(req, res);

    if (!user) {
        return res.status(401).send({error: 'You are not logged in!'});
    }

    const {postalAddress, orderId} = req.body;

    if (!postalAddress) {
        return res.status(401).send({error: 'Postal address is required'});
    }
    const order = await Orders.findOne({_id: orderId, userId: user.id});

    if (!order || order.status !== orderStatus.NONE) {
        return res.status(404).send({error: 'Order not found'});
    }

    try {
        const updatedOrder = await Orders.findOneAndUpdate({
            _id: orderId,
            userId: user.id
        }, {postalAddress: postalAddress}, {new: true});
        res.status(200).send(updatedOrder);
    } catch (err) {
        res.status(500).send({error: err.message});
    }

})

router.patch("/confirm-order-user", async (req, res) => {
    const user = await authChecker(req, res);

    if (!user) {
        return res.status(401).send({error: 'You are not logged in!'});
    }

    const {orderId} = req.body;

    if (!orderId) {
        return res.status(401).send({error: 'Order id is required!'});
    }
    const order = await Orders.findOne({_id: orderId, userId: user.id});

    if (!order || order.status !== orderStatus.NONE) {
        return res.status(404).send({error: 'Order not found'});
    }
    try {
        const updatedOrder = await Orders.findOneAndUpdate({
            _id: orderId,
            userId: user.id
        }, {status: orderStatus.PENDING}, {new: true});
        res.status(200).send(updatedOrder);
    } catch (err) {
        res.status(500).send({error: err.message});
    }

})

router.delete("/delete-order", async (req, res) => {
    const user = await authChecker(req, res);

    if (!user) {
        return res.status(401).send({error: 'You are not logged in!'});
    }

    const {orderId} = req.body;

    try {
        await Orders.findByIdAndDelete(orderId);
        res.status(200).send({message: "Order deleted successfully"});
    } catch (err) {
        res.status(500).send({error: err.message})
    }
})

router.get("/find-orderById", async (req, res) => {
    const user = await authChecker(req, res);
    if (!user) {
        return res.status(404).send({error: 'You are not logged in!'});
    }
    const {orderId} = req.body;
    if (!orderId) {
        res.status(400).send({error: 'Order id is required!'});
    }
    try {
        const order = await Orders.findById(orderId);
        if (user.id === order.userId || user.role === roles.ADMIN) {
            res.status(200).send(order);
        } else {
            return res.status(403).send({error: "Operation not allowed!"})
        }

    } catch (err) {
        res.status(500).send({error: err.message});
    }
})


router.get("/all-user-orders", async (req, res) => {

    const user = await authChecker(req, res);
    if (!user) {
        return res.status(404).send({error: 'You are not logged in!'});
    }
    try {
        const orders = await Orders.find({userId: user.id});
        res.status(200).send(orders);
    } catch (err) {
        res.status(500).send({error: err.message});
    }
})


export default router;