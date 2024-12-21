import { mongooseConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
const stripe = require('stripe')(process.env.STRIPE_SK);
import { buffer } from 'micro'

const endpointSecret = "whsec_cbe45963ca2874366e1bd0be337a364a83b1c7c8e1b868adc4056c2b99ff0159"

export default async function handler(req,res) {
    await mongooseConnect();
    const sig = req.headers['stripe-signature'];
  
    let event;
  
    try {
      event = stripe.webhooks.constructEvent(await buffer(req), sig, endpointSecret);
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
  
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const data = event.data.object;
        const orderId = data.metadata.orderId;
        const paid = data.payment_status === 'paid';
        if (orderId && paid) {
          await Order.findByIdAndUpdate(orderId,{
            paid:true,
          })
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  
    res.status(200).send('ok');
  }
  
  export const config = {
    api: {bodyParser:false,}
  };

// ardent-better-loving-trust
// acct_1Q8OJhKOJ1QeS04I