const express = require('express');
const nodemailer = require('nodemailer');
const Order = require('../models/Order');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Email transporter - Using regular Gmail password
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false,
    ciphers: 'SSLv3'
  }
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { orderItems, shippingAddress, totalPrice, notes } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Generate unique order number
    const orderNumber = 'NS' + Date.now() + Math.floor(Math.random() * 1000);

    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      totalPrice,
      notes,
      orderNumber: orderNumber
    });

    const createdOrder = await order.save();
    
    // Populate user information for email
    await createdOrder.populate('user');

    // Send email notification
    try {
      console.log('Attempting to send email...');
      console.log('EMAIL_USER:', process.env.EMAIL_USER);
      console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
      
      const emailContent = `
        <h2>New Order Received - NS Luxurious</h2>
        <h3>Order Details:</h3>
        <p><strong>Order Number:</strong> ${createdOrder.orderNumber}</p>
        <p><strong>Order Date:</strong> ${new Date(createdOrder.createdAt).toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> $${createdOrder.totalPrice.toFixed(2)}</p>
        
        <h3>Customer Information:</h3>
        <p><strong>Name:</strong> ${createdOrder.user.name}</p>
        <p><strong>Email:</strong> ${createdOrder.user.email}</p>
        <p><strong>Phone:</strong> ${createdOrder.user.phone}</p>
        
        <h3>Shipping Address:</h3>
        <p>${createdOrder.shippingAddress.name}</p>
        <p>${createdOrder.shippingAddress.address}</p>
        <p>${createdOrder.shippingAddress.city}, ${createdOrder.shippingAddress.postalCode}</p>
        <p>${createdOrder.shippingAddress.country}</p>
        <p><strong>Phone:</strong> ${createdOrder.shippingAddress.phone}</p>
        
        <h3>Order Items:</h3>
        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <tr style="background-color: #f5f5f5;">
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
          ${createdOrder.orderItems.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.price.toFixed(2)}</td>
              <td>${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
        
        ${createdOrder.notes ? `<h3>Customer Notes:</h3><p>${createdOrder.notes}</p>` : ''}
        
        <p><strong>Order Status:</strong> ${createdOrder.orderStatus.toUpperCase()}</p>
        
        <hr>
        <p><em>This is an automated notification from NS Luxurious e-commerce system.</em></p>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'nessbusiness66@gmail.com',
        subject: `New Order #${createdOrder.orderNumber} - NS Luxurious`,
        html: emailContent
      };

      console.log('Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      const emailResult = await transporter.sendMail(mailOptions);
      console.log('📧 EMAIL NOTIFICATION 📧');
      console.log('═══════════════════════════════════');
      console.log('TO:', mailOptions.to);
      console.log('SUBJECT:', mailOptions.subject);
      console.log('ORDER NUMBER:', createdOrder.orderNumber);
      console.log('CUSTOMER:', createdOrder.user.name);
      console.log('TOTAL:', `${createdOrder.totalPrice.toFixed(2)}`);
      console.log('═══════════════════════════════════');
      console.log('Email content logged above ↑');
      console.log('(In development mode - not actually sent)');
      console.log('═══════════════════════════════════');
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      console.error('Full error:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get user orders
// @route   GET /api/orders/my
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Make sure user can only see their own orders
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;