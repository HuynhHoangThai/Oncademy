import { Webhook } from "svix";
import User from "../models/User.js";
import stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";
import PathwayCourse from "../models/PathwayCourse.js";
import { syncEducatorDashboard } from "../utils/dashboardHelper.js";
import { sendCourseEnrollmentEmail, sendPathwayEnrollmentEmail } from "../utils/emailService.js";

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
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (request, response) => {
  console.log('🎯 [STRIPE WEBHOOK] Received webhook request');
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ [STRIPE WEBHOOK] Event verified:', event.type);
  }
  catch (err) {
    console.error('❌ [STRIPE WEBHOOK] Verification failed:', err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('🔄 [STRIPE WEBHOOK] Processing event type:', event.type);
  console.log('📦 [STRIPE WEBHOOK] Event data:', JSON.stringify(event.data, null, 2));

  switch (event.type) {
    case 'checkout.session.completed':
      console.log('🛒 [CHECKOUT COMPLETED] Handling checkout session completed');
      const checkoutSession = event.data.object;
      console.log('🔍 [CHECKOUT] Session ID:', checkoutSession.id);
      console.log('🔍 [CHECKOUT] Payment status:', checkoutSession.payment_status);
      console.log('🔍 [CHECKOUT] Metadata:', checkoutSession.metadata);

      if (checkoutSession.payment_status === 'paid' && checkoutSession.metadata.purchaseId) {
        const { purchaseId } = checkoutSession.metadata;
        console.log('🔍 [CHECKOUT] Purchase ID:', purchaseId);

        try {
          const purchaseData = await Purchase.findById(purchaseId);
          const userData = await User.findById(purchaseData.userId);

          // Handle Pathway Purchase
          if (purchaseData.pathwayId) {
            const pathwayData = await PathwayCourse.findById(purchaseData.pathwayId.toString());

            // Check if student is already enrolled
            const isAlreadyEnrolled = pathwayData.enrolledStudents.some(
              studentId => studentId.toString() === userData._id.toString()
            );

            if (!isAlreadyEnrolled) {
              pathwayData.enrolledStudents.push(userData._id);
              await pathwayData.save();

              userData.enrolledPathways.push(pathwayData._id);
              await userData.save();

              console.log(`✅ [CHECKOUT] Student ${userData.name} enrolled in pathway ${pathwayData.pathwayTitle}`);
            } else {
              console.log(`ℹ️ [CHECKOUT] Student ${userData.name} already enrolled in pathway ${pathwayData.pathwayTitle}`);
            }

            purchaseData.status = 'completed';
            await purchaseData.save();

            // Send enrollment email
            console.log('🔍 [CHECKOUT] About to send pathway enrollment email to:', userData.email);
            try {
              const emailResult = await sendPathwayEnrollmentEmail({
                userEmail: userData.email,
                userName: userData.name,
                pathwayTitle: pathwayData.pathwayTitle,
                pathwayId: pathwayData._id.toString()
              });
              console.log('✅ [CHECKOUT] Pathway enrollment email result:', emailResult);
            } catch (emailError) {
              console.error('❌ [CHECKOUT] Failed to send pathway enrollment email:', emailError);
            }

            // Sync educator dashboard
            const educatorId = pathwayData.educator;
            await syncEducatorDashboard(educatorId).catch(err => {
              console.error('Dashboard sync error after checkout:', err);
            });

          }
          // Handle Course Purchase
          else if (purchaseData.courseId) {
            const courseData = await Course.findById(purchaseData.courseId.toString());

            // Check if student is already enrolled
            const isAlreadyEnrolled = courseData.enrolledStudents.some(
              studentId => studentId.toString() === userData._id.toString()
            );

            if (!isAlreadyEnrolled) {
              courseData.enrolledStudents.push(userData._id);
              await courseData.save();

              userData.enrolledCourses.push(courseData._id);
              await userData.save();

              console.log(`✅ [CHECKOUT] Student ${userData.name} enrolled in course ${courseData.courseTitle}`);
            } else {
              console.log(`ℹ️ [CHECKOUT] Student ${userData.name} already enrolled in course ${courseData.courseTitle}`);
            }

            purchaseData.status = 'completed';
            await purchaseData.save();

            // Send enrollment email
            console.log('🔍 [CHECKOUT] About to send enrollment email to:', userData.email);
            try {
              const emailResult = await sendCourseEnrollmentEmail({
                userEmail: userData.email,
                userName: userData.name,
                courseTitle: courseData.courseTitle,
                courseId: courseData._id.toString()
              });
              console.log('✅ [CHECKOUT] Enrollment email result:', emailResult);
            } catch (emailError) {
              console.error('❌ [CHECKOUT] Failed to send enrollment email:', emailError);
            }

            // Sync educator dashboard
            const educatorId = courseData.educator;
            await syncEducatorDashboard(educatorId).catch(err => {
              console.error('Dashboard sync error after checkout:', err);
            });
          }

        } catch (error) {
          console.error('❌ [CHECKOUT] Error processing checkout session:', error);
        }
      }
      break;

    case 'payment_intent.succeeded':
      console.log('💰 [PAYMENT SUCCESS] Payment intent succeeded!');
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      console.log('🔍 [PAYMENT SUCCESS] Payment Intent ID:', paymentIntentId);

      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });
      console.log('🔍 [PAYMENT SUCCESS] Sessions found:', session.data.length);
      const { purchaseId } = session.data[0].metadata;
      console.log('🔍 [PAYMENT SUCCESS] Purchase ID:', purchaseId);

      const purchaseData = await Purchase.findById(purchaseId);
      const userData = await User.findById(purchaseData.userId);

      // Handle Pathway Purchase
      if (purchaseData.pathwayId) {
        const pathwayData = await PathwayCourse.findById(purchaseData.pathwayId.toString());

        // Check if student is already enrolled
        const isAlreadyEnrolled = pathwayData.enrolledStudents.some(
          studentId => studentId.toString() === userData._id.toString()
        );

        if (!isAlreadyEnrolled) {
          pathwayData.enrolledStudents.push(userData._id);
          await pathwayData.save();

          userData.enrolledPathways.push(pathwayData._id);
          await userData.save();

          console.log(`✅ Student ${userData.name} enrolled in pathway ${pathwayData.pathwayTitle}`);
        } else {
          console.log(`ℹ️ Student ${userData.name} already enrolled in pathway ${pathwayData.pathwayTitle}`);
        }

        purchaseData.status = 'completed';
        await purchaseData.save();

        // 📧 Send enrollment confirmation email
        console.log('🔍 [WEBHOOK] About to send pathway enrollment email to:', userData.email);
        try {
          const emailResult = await sendPathwayEnrollmentEmail({
            userEmail: userData.email,
            userName: userData.name,
            pathwayTitle: pathwayData.pathwayTitle,
            pathwayId: pathwayData._id.toString()
          });
          console.log('✅ [WEBHOOK] Pathway enrollment email result:', emailResult);
        } catch (emailError) {
          console.error('❌ [WEBHOOK] Failed to send pathway enrollment email:', emailError);
        }

        // Sync educator dashboard
        const educatorId = pathwayData.educator;
        await syncEducatorDashboard(educatorId).catch(err => {
          console.error('Dashboard sync error after purchase:', err);
        });

      }
      // Handle Course Purchase
      else if (purchaseData.courseId) {
        const courseData = await Course.findById(purchaseData.courseId.toString());

        // Check if student is already enrolled to prevent duplicates
        const isAlreadyEnrolled = courseData.enrolledStudents.some(
          studentId => studentId.toString() === userData._id.toString()
        );

        if (!isAlreadyEnrolled) {
          courseData.enrolledStudents.push(userData._id);
          await courseData.save();

          userData.enrolledCourses.push(courseData._id);
          await userData.save();

          console.log(`✅ Student ${userData.name} enrolled in course ${courseData.courseTitle}`);
        } else {
          console.log(`ℹ️ Student ${userData.name} already enrolled in course ${courseData.courseTitle}`);
        }

        purchaseData.status = 'completed';
        await purchaseData.save();

        // 📧 Send enrollment confirmation email
        console.log('🔍 [WEBHOOK] About to send enrollment email to:', userData.email);
        try {
          const emailResult = await sendCourseEnrollmentEmail({
            userEmail: userData.email,
            userName: userData.name,
            courseTitle: courseData.courseTitle,
            courseId: courseData._id.toString()
          });
          console.log('✅ [WEBHOOK] Enrollment email result:', emailResult);
        } catch (emailError) {
          console.error('❌ [WEBHOOK] Failed to send enrollment email:', emailError);
        }

        // Sync educator dashboard after successful purchase
        const educatorId = courseData.educator;
        await syncEducatorDashboard(educatorId).catch(err => {
          console.error('Dashboard sync error after purchase:', err);
        });
      }

      break;

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });
      const { purchaseId } = session.data[0].metadata;
      const purchaseData = await Purchase.findById(purchaseId);
      purchaseData.status = 'failed';
      await purchaseData.save();
      break;
    }
    // ... handle other event types
    default:
      console.log(`⚠️ [STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
      console.log('📦 [STRIPE WEBHOOK] Full event:', JSON.stringify(event, null, 2));
  }
  response.json({ received: true });

}