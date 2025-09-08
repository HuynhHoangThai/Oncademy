import { Webhook } from "svix";
import User from "../models/User.js";

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
