// controllers/ordersController.js
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'name email')
            .populate('orderItems.product', 'name price')
            .sort({ dateOrdered: -1 });
            
        res.render('admin/orders', { 
            title: 'Order Management',
            orders 
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).render('error', { message: 'Failed to load orders' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const order = await Order.findByIdAndUpdate(
            id,
            { orderStatus: status },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        res.redirect('/admin/orders');
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).render('error', { message: 'Failed to update order' });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        await Order.findByIdAndDelete(id);
        res.redirect('/admin/orders');
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).render('error', { message: 'Failed to delete order' });
    }
};

exports.exportOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('user', 'name email')
            .populate('orderItems.product', 'name');
            
        let csv = 'Order ID,Date,Customer,Products,Quantity,Total,Status\n';
        
        orders.forEach(order => {
            const date = order.dateOrdered.toISOString().split('T')[0];
            const customer = order.user.name;
            const status = order.orderStatus;
            const total = order.total;
            
            order.orderItems.forEach(item => {
                csv += `"${order._id}","${date}","${customer}","${item.product.name}","${item.quantity}","${total}","${status}"\n`;
            });
        });
        
        res.header('Content-Type', 'text/csv');
        res.attachment('orders-export.csv');
        res.send(csv);
    } catch (error) {
        console.error('Export failed:', error);
        res.status(500).send('Export failed');
    }
};