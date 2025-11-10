import { Webhook } from "svix";
import User from "../models/User.js";
<<<<<<< HEAD
import Stripe from "stripe";
=======
import stripe from "stripe";
>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

// API Controller Function to Manage Clerk User with database
export const clerkWebhooks = async (req, res) => {
  try {

    // Create a Svix instance with clerk webhook secret.
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

    // Verifying Headers
    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"]
    })

    // Getting Data from request body
    const { data, type } = req.body

    // Switch Cases for differernt Events
    switch (type) {
      case 'user.created': {
        try {
          console.log('Received user.created webhook:', JSON.stringify(data));
          const email = Array.isArray(data.email_addresses) && data.email_addresses[0]?.email_address ? data.email_addresses[0].email_address : '';
          const firstName = data.first_name || '';
          const lastName = data.last_name || '';
          const name = (firstName + ' ' + lastName).trim();
          const imageUrl = data.image_url || data.profile_image_url || '';
          if (!data.id || !email || !name || !imageUrl) {
            console.error('Missing required user fields:', { id: data.id, email, name, imageUrl });
            return res.status(200).json({ success: false, message: 'Missing required user fields', fields: { id: data.id, email, name, imageUrl } });
          }
          const userData = {
            _id: data.id,
            email,
            name,
            imageUrl,
            resume: ''
          }
          await User.create(userData)
          res.status(200).json({ success: true })
        } catch (err) {
          console.error('Error creating user:', err);
          res.status(200).json({ success: false, message: err.message })
        }
        break;
      }

      case 'user.updated': {
        const userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        }
        await User.findByIdAndUpdate(data.id, userData)
        res.json({})
        break;
      }

      case 'user.deleted': {
        await User.findByIdAndDelete(data.id)
        res.json({})
        break;
      }
      default:
        break;
    }

  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}
<<<<<<< HEAD

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers['stripe-signature'];
=======
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

export const  stripeWebhooks = async (request, response) => {
   const sig = request.headers['stripe-signature'];
>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2

  let event;

  try {
<<<<<<< HEAD
    event = Stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':{
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      const sessions = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      })
      
      const { purchaseId } = sessions.data[0].metadata;

=======
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  }
  catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });
      const {purchaseId} = session.data[0].metadata;
      
>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2
      const purchaseData = await Purchase.findById(purchaseId);
      const userData = await User.findById(purchaseData.userId);
      const courseData = await Course.findById(purchaseData.courseId.toString());
      
      courseData.enrolledStudents.push(userData);
      await courseData.save();
      
      userData.enrolledCourses.push(courseData);
      await userData.save();
<<<<<<< HEAD

=======
      
>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2
      purchaseData.status = 'completed';
      await purchaseData.save();

      break;
<<<<<<< HEAD
    }

    case 'payment_intent.payment_failed': {
      
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      const sessions = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      })

      const { purchaseId } = sessions.data[0].metadata;
      const purchaseData = await Purchase.findById(purchaseId);

      purchaseData.status = 'failed';
      await purchaseData.save();

      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
=======
    
      case 'payment_intent.payment_failed':{
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;
        const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });
      const {purchaseId} = session.data[0].metadata;
      const purchaseData = await Purchase.findById(purchaseId);
      purchaseData.status = 'failed';
      await purchaseData.save();
      break;}
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  response.json({ received: true });

>>>>>>> fbb53938042728fd323b5c2b1836eb4eaa5196e2
}