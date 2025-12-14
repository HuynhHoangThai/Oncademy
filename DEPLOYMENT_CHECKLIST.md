# 📋 Quick Deployment Checklist

## Before Deployment
- [ ] Code pushed to GitHub
- [ ] All environment variables documented
- [ ] vercel.json configured

## Backend Deployment
1. [ ] Login to Vercel
2. [ ] Import project, set root to `server`
3. [ ] Add all environment variables
4. [ ] Deploy
5. [ ] Test API endpoints
6. [ ] Note backend URL: `https://oncademy-backend.vercel.app`

## Frontend Deployment  
1. [ ] Import project again, set root to `client`
2. [ ] Add frontend env vars (VITE_BACKEND_URL, VITE_CLERK_PUBLISHABLE_KEY)
3. [ ] Deploy
4. [ ] Note frontend URL: `https://oncademy-frontend.vercel.app`

## Post-Deployment
1. [ ] Update `FRONTEND_URL` in backend env vars → Redeploy backend
2. [ ] Configure Clerk webhook: `https://backend-url/api/webhooks/clerk`
3. [ ] Configure Stripe webhook: `https://backend-url/api/webhooks/stripe`
4. [ ] Test complete user flow: Register → Browse → Purchase → Enroll

## Testing Flow
- [ ] User registration works
- [ ] Courses load on homepage
- [ ] Course details page works
- [ ] Stripe checkout works
- [ ] Enrollment auto-completes after payment
- [ ] My Enrollments shows enrolled courses
- [ ] Video player works
- [ ] Quiz system works

## Done! 🎉
Your app is live at:
- Frontend: https://oncademy-frontend.vercel.app  
- Backend: https://oncademy-backend.vercel.app
