import mongoose from 'mongoose';

/**
 * Dashboard Model - Educator Analytics
 * 
 * ⚠️ QUAN TRỌNG: Bảng này là CACHE LAYER để tối ưu hiệu năng
 * Dữ liệu được KẾ THỪA và TỰ ĐỘNG ĐỒNG BỘ từ:
 * 
 * 1. Course Table (bảng Course)
 *    - Tổng số khóa học (totalCourses)
 *    - Thống kê từng khóa học (courseStats[])
 * 
 * 2. Purchase Table (bảng Purchase) 
 *    - Tổng doanh thu (totalEarnings = SUM của Purchase.amount với status='completed')
 *    - Tổng giao dịch (totalPurchases = COUNT Purchase với status='completed')
 *    - Danh sách ghi danh gần nhất (recentEnrollments[])
 *    - Top khóa học bán chạy (topCourses[])
 *    - Doanh thu theo tháng (monthlyEarnings[])
 * 
 * 3. User Table (bảng User)
 *    - Tổng học viên unique (totalEnrollments)
 *    - Thông tin chi tiết học viên (enrolledStudents[])
 * 
 * AUTO-SYNC TRIGGERS (Tự động đồng bộ khi):
 * ✅ Educator tạo khóa học mới → educatorController.addCourse()
 * ✅ User mua khóa học thành công → webhooks.stripeWebhooks() (payment_intent.succeeded)
 * ✅ Dashboard cũ hơn 5 phút → getEducatorDashboard() tự động sync
 * ✅ Manual sync → forceSyncDashboard() endpoint
 * 
 * LOGIC ĐỒNG BỘ: server/utils/dashboardHelper.js → syncEducatorDashboard()
 */

const dashboardSchema = new mongoose.Schema({
    // ============================================
    // EDUCATOR IDENTIFIER (UNIQUE)
    // ============================================
    educatorId: { 
        type: String, 
        required: true, 
        unique: true,  // Mỗi educator chỉ có 1 dashboard document
        index: true,   // Index để query nhanh
        ref: 'User' 
    },
    
    // ============================================
    // THỐNG KÊ TỔNG QUAN (Aggregated Statistics)
    // ============================================
    
    // Tổng số khóa học (từ Course table)
    totalCourses: { 
        type: Number, 
        default: 0,
        min: 0
    },
    
    // Tổng doanh thu (từ Purchase table, status='completed')
    totalEarnings: { 
        type: Number, 
        default: 0,
        min: 0
    },
    
    // Tổng số giao dịch thành công (từ Purchase table)
    totalPurchases: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Tổng số học viên unique (từ Purchase + Course.enrolledStudents)
    totalEnrollments: { 
        type: Number, 
        default: 0,
        min: 0
    },
    
    // ============================================
    // CHI TIẾT KHÓA HỌC (Course Details)
    // Nguồn: Course.find({ educator: educatorId })
    // ============================================
    courseStats: [{
        courseId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Course',
            required: true
        },
        courseTitle: { type: String, required: true },
        courseThumbnail: String,
        coursePrice: { type: Number, default: 0 },
        enrolledCount: { type: Number, default: 0 }, // Từ Course.enrolledStudents.length
        createdAt: Date
    }],
    
    // ============================================
    // TOP KHÓA HỌC (Top Performing Courses)
    // Nguồn: GROUP BY courseId, SUM(Purchase.amount), ORDER BY revenue DESC
    // ============================================
    topCourses: [{
        courseId: { type: String, required: true },
        courseTitle: { type: String, required: true },
        totalRevenue: { type: Number, default: 0, min: 0 },
        purchaseCount: { type: Number, default: 0, min: 0 }
    }],
    
    // ============================================
    // DOANH THU THEO THÁNG (Monthly Earnings)
    // Nguồn: GROUP BY MONTH(Purchase.createdAt), SUM(Purchase.amount)
    // ============================================
    monthlyEarnings: [{
        month: { type: String, required: true }, // Format: "Nov 2025"
        earnings: { type: Number, default: 0, min: 0 }
    }],
    
    // ============================================
    // DANH SÁCH GHI DANH GẦN NHẤT (Recent Enrollments)
    // Nguồn: JOIN Purchase + User + Course, LIMIT 50, ORDER BY createdAt DESC
    // ============================================
    recentEnrollments: [{
        studentId: { 
            type: String, 
            ref: 'User',
            required: true
        },
        studentName: { type: String, default: 'Unknown' },
        studentEmail: String,
        studentImage: String,
        courseId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Course',
            required: true
        },
        courseTitle: { type: String, default: 'Unknown Course' },
        courseThumbnail: String,
        amount: { type: Number, default: 0 },
        enrolledAt: { 
            type: Date, 
            default: Date.now,
            required: true
        },
        purchaseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Purchase'
        }
    }],
    
    // ============================================
    // DANH SÁCH HỌC VIÊN (Enrolled Students)
    // Nguồn: User.find({ _id: { $in: uniqueStudentIds } })
    // uniqueStudentIds = MERGE(Purchase.userId + Course.enrolledStudents)
    // ============================================
    enrolledStudents: [{
        id: { type: String, ref: 'User', required: true },
        name: { type: String, required: true },
        email: String,
        imageUrl: String,
        joinedAt: { type: Date, required: true }
    }],
    
    // ============================================
    // METADATA
    // ============================================
    lastUpdated: { 
        type: Date, 
        default: Date.now,
        required: true,
        index: true  // Index để check staleness
    }
}, { 
    timestamps: true,
    collection: 'dashboards'
});

// ============================================
// INDEXES
// ============================================
// Compound index cho query với filter theo time
dashboardSchema.index({ educatorId: 1, lastUpdated: -1 });

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Kiểm tra dashboard có cũ không (> 5 phút)
 */
dashboardSchema.methods.isStale = function() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return !this.lastUpdated || this.lastUpdated < fiveMinutesAgo;
};

/**
 * Lấy summary ngắn gọn
 */
dashboardSchema.methods.getSummary = function() {
    return {
        educatorId: this.educatorId,
        totalCourses: this.totalCourses,
        totalEarnings: this.totalEarnings,
        totalEnrollments: this.totalEnrollments,
        totalPurchases: this.totalPurchases,
        lastUpdated: this.lastUpdated
    };
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Tìm dashboard và auto-sync nếu cũ
 * @param {String} educatorId - ID của educator
 * @param {Function} syncFunction - Function để sync (syncEducatorDashboard)
 */
dashboardSchema.statics.findOrSync = async function(educatorId, syncFunction) {
    let dashboard = await this.findOne({ educatorId });
    
    if (!dashboard || dashboard.isStale()) {
        dashboard = await syncFunction(educatorId);
    }
    
    return dashboard;
};

const Dashboard = mongoose.model('Dashboard', dashboardSchema);

export default Dashboard;
