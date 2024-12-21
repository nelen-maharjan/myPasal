import { mongooseConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import axios from "axios";

// Khalti API Key
const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(400).json({ error: 'Request must be a POST' });
    }

    const { 
        name, email, phone, city, 
        postalCode, streetAddress, country,
        cartProducts,
    } = req.body;

    try {
        // Step 1: Connect to the database
        await mongooseConnect();

        // Step 2: Fetch the product information based on cartProduct IDs
        const productsIds = cartProducts;
        const uniqueIds = [...new Set(productsIds)];
        const productsInfos = await Product.find({ _id: uniqueIds });

        if (!productsInfos || productsInfos.length === 0) {
            return res.status(400).json({ error: "No valid products found in the cart." });
        }

        // Step 3: Calculate total amount and prepare line items
        let totalAmount = 0;
        let lineItems = [];

        for (const productId of uniqueIds) {
            const productInfo = productsInfos.find(p => p._id.toString() === productId);
            const quantity = productsIds.filter(id => id === productId).length || 0;

            if (quantity > 0 && productInfo) {
                const productTotal = quantity * productInfo.price;
                totalAmount += productTotal;

                lineItems.push({
                    quantity,
                    name: productInfo.title,
                    price: productTotal,
                });
            }
        }

        // Step 4: Prepare the request data for Khalti
        const paymentData = {
            return_url: process.env.PUBLIC_URL + "/cart?success=1",  // Redirect after payment
            website_url: process.env.PUBLIC_URL,  // Your website URL
            amount: totalAmount * 100,  // Amount in paisa (1 NPR = 100 paisa)
            purchase_order_id: `Order_${Date.now()}`,  // Unique order ID
            purchase_order_name: `Order from ${name}`,
            customer_info: {
                name: name,
                email: email,
                phone: phone,  // Ensure phone is included
            },
            amount_breakdown: [
                {
                    label: "Total",
                    amount: totalAmount * 100,  // Total amount in paisa
                },
            ],
            product_details: cartProducts.map((productId) => {
                const product = productsInfos.find(p => p._id.toString() === productId);
                if (!product) {
                    console.error(`Product with ID ${productId} not found!`);
                }
                return {
                    identity: productId,
                    name: product?.title || 'Unknown Product',
                    total_price: product?.price * 100 || 0,
                    quantity: cartProducts.filter(id => id === productId).length,
                    unit_price: product?.price * 100 || 0,
                };
            }),
        };

        // Step 5: Send the payment request to Khalti API
        // Backend - Checkout handler

try {
    const response = await axios.post('https://a.khalti.com/api/v2/epayment/initiate/', paymentData, {
        headers: {
            'Authorization': `key ${KHALTI_SECRET_KEY}`,
            'Content-Type': 'application/json',
        }
    });

    const responseBody = response.data;

    if (responseBody.payment_url) {  // Check for the correct key in response
        // Create the order in the database after payment initiation
        const orderDoc = await Order.create({
            line_items: lineItems,
            name,
            email,
            city,
            postalCode,
            streetAddress,
            country,
            paid: false, // Mark order as not paid initially
        });

        // Return the Khalti payment URL to the frontend
        return res.json({
            url: responseBody.payment_url,  // Correct the key from 'url' to 'payment_url'
        });
    } else {
        console.error("Payment link creation failed:", responseBody);
        return res.status(400).json({ error: "Failed to create payment link" });
    }
} catch (error) {
    console.error("Error during payment initiation:", error.response ? error.response.data : error.message);
    return res.status(500).json({ error: error.response ? error.response.data : 'Internal server error' });
}

    } catch (error) {
        console.error("Error during checkout:", error.message);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
