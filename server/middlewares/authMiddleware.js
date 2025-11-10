import { clerkClient } from "@clerk/express"

// Middleware ( Protect Educator Routes )
export const protectEducator = async (req,res,next) => {

    try {

    const userId = typeof req.auth === 'function' ? req.auth().userId : req.auth.userId
        
        console.log('🔍 protectEducator Debug:');
        console.log('req.auth type:', typeof req.auth);
        console.log('userId:', userId);

        if (!userId) {
            console.log('❌ No userId found');
            return res.json({success:false, message: 'Unauthorized Access - No userId'})
        }

        const response = await clerkClient.users.getUser(userId)
        console.log('User data:', response);
        console.log('publicMetadata:', response.publicMetadata);
        console.log('role:', response.publicMetadata.role);

        if (response.publicMetadata.role !== 'educator') {
            console.log('❌ Role mismatch:', response.publicMetadata.role, '!== educator');
            return res.json({success:false, message: 'Unauthorized Access - Not an educator'})
        }
        
        // Set userId for downstream controllers
        req.userId = userId;
        
        console.log('✅ Educator verified, userId set to:', req.userId);
        next ()

    } catch (error) {
        console.error('❌ protectEducator error:', error);
        res.json({success:false, message: error.message})
    }

}