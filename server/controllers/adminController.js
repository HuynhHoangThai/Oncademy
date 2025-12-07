export const approveEducator = async (req, res) => {
    const { userId } = req.body;

    await User.findByIdAndUpdate(userId, { applicationStatus: 'approved' });

    await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: {
            role: 'educator',
            applicationStatus: 'approved',
        },
    });

    res.json({ success: true, message: 'Đã duyệt thành công.' });
}