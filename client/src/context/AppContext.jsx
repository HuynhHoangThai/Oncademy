import {createContext,useEffect,useState} from "react";
import { dummyCourses } from "../assets/assets";
import humanizeDuration from "humanize-duration";
import { useUser } from '@clerk/clerk-react';

const AppContext = createContext()

const AppProvider = (props) => {
    const {user} = useUser(); // Get current user from Clerk
    const currency = import.meta.env.VITE_CURRENCY
    const [allCourses, setAllCourses] = useState([])
    const [isEducator, setIsEducator] = useState(true)
    const [enrolledCourses, setEnrolledCourses] = useState([])
    
    // Use user-specific localStorage key
    const getUserRatingsKey = () => user ? `courseRatings_${user.id}` : 'courseRatings_guest';
    
    const [courseRatings, setCourseRatings] = useState({})
    const [ratingUpdateTrigger, setRatingUpdateTrigger] = useState(0)
    
    
    const fecthAllCourses = async () => {
        setAllCourses(dummyCourses)
    }
    const caculateRating =(course) => {
        if(course.courseRating.length === 0) {
            return 0;
        }
        let totalRating = 0
        course.courseRating.forEach(rating=> {  
            totalRating += rating.rating
        })
        return totalRating / course.courseRating.length
    }
    const calculateChapterTime= (chapter)=> {
        let time=0
        chapter.chapterContent.map((lecture)=> time+=lecture.lectureDuration )
        return humanizeDuration(time *60 * 1000, { unit:["h","m"] });
    }
    const calculateCourseDuration = (course) => {
        let time=0
        course.courseContent.map((chapter)=>chapter.chapterContent.map((lecture)=> time+=lecture.lectureDuration ))
        return humanizeDuration(time *60 * 1000, { unit:["h","m"] });

    }
     const calculateNoOfLectures = (course) => {
        let totalLectures = 0;
        course.courseContent.forEach(chapter => {
            if (Array.isArray(chapter.chapterContent)) {
                totalLectures += chapter.chapterContent.length;
            }
        });
        return totalLectures;
    }
    const fetchUserEnrolledCourses = async () => {
        setEnrolledCourses(dummyCourses)
    }

    // Rating functions
    const addCourseRating = (courseId, rating, review = '') => {
        if (!user) return;
        // Lấy mảng ratings hiện tại cho course
        const ratingsArr = courseRatings[courseId] ? [...courseRatings[courseId]] : [];
        // Kiểm tra user đã rate chưa
        const idx = ratingsArr.findIndex(r => r.userId === user.id);
        if (idx !== -1) {
            ratingsArr[idx] = { userId: user.id, rating, review, timestamp: new Date().toISOString() };
        } else {
            ratingsArr.push({ userId: user.id, rating, review, timestamp: new Date().toISOString() });
        }
        const newRatings = {
            ...courseRatings,
            [courseId]: ratingsArr
        };
        setCourseRatings(newRatings);
        const key = 'courseRatings_all';
        localStorage.setItem(key, JSON.stringify(newRatings));
        setRatingUpdateTrigger(prev => prev + 1);
    }

    const getUserRatingForCourse = (courseId) => {
        if (!user) return 0;
        const ratingsArr = courseRatings[courseId] || [];
        const found = ratingsArr.find(r => r.userId === user.id);
        return found ? found.rating : 0;
    }

    const calculateRating = (course) => {
        let totalRating = 0;
        let ratingCount = 0;
        // Dummy ratings
        if (course.courseRating && course.courseRating.length > 0) {
            course.courseRating.forEach(rating => {
                totalRating += rating.rating;
                ratingCount++;
            });
        }
        // User ratings
        const ratingsArr = courseRatings[course._id] || [];
        ratingsArr.forEach(r => {
            totalRating += r.rating;
            ratingCount++;
        });
        if (ratingCount === 0) return 0;
        return Math.round((totalRating / ratingCount) * 10) / 10;
    }

    const getTotalReviewCount = (course) => {
        const dummyCount = course.courseRating?.length || 0;
        const userCount = (courseRatings[course._id] || []).length;
        return dummyCount + userCount;
    }
    useEffect(() => {
        fecthAllCourses()
        fetchUserEnrolledCourses()
    },[])
    
    // Load ratings when user is ready or changes
    // Load all ratings (all users) from localStorage
    useEffect(() => {
        const key = 'courseRatings_all';
        const saved = localStorage.getItem(key);
        const loadedRatings = saved ? JSON.parse(saved) : {};
        setCourseRatings(loadedRatings);
        setRatingUpdateTrigger(prev => prev + 1);
    }, [user]);
    
    // Favorite courses logic
    const getFavoriteKey = () => user ? `favoriteCourses_${user.id}` : 'favoriteCourses_guest';
    const [favoriteCourses, setFavoriteCourses] = useState([]);

    // View history logic
    const [viewHistory, setViewHistory] = useState([]);

    useEffect(() => {
        const key = user ? `favoriteCourses_${user.id}` : 'favoriteCourses_guest';
        const saved = localStorage.getItem(key);
        setFavoriteCourses(saved ? JSON.parse(saved) : []);
    }, [user]);

    useEffect(() => {
        const key = user ? `viewHistory_${user.id}` : 'viewHistory_guest';
        const saved = localStorage.getItem(key);
        setViewHistory(saved ? JSON.parse(saved) : []);
    }, [user]);

    const toggleFavoriteCourse = (courseId) => {
        let updated;
        if (favoriteCourses.includes(courseId)) {
            updated = favoriteCourses.filter(id => id !== courseId);
        } else {
            updated = [...favoriteCourses, courseId];
        }
        setFavoriteCourses(updated);
        localStorage.setItem(getFavoriteKey(), JSON.stringify(updated));
    };

    const isCourseFavorite = (courseId) => favoriteCourses.includes(courseId);

    const getFavoriteCourses = () => favoriteCourses;

    // View history functions
    const addToViewHistory = (courseId) => {
        if (!courseId) return;
        
        const key = user ? `viewHistory_${user.id}` : 'viewHistory_guest';
        let updated = [...viewHistory];
        
        // Remove if already exists to move to front
        updated = updated.filter(item => item.courseId !== courseId);
        
        // Add to front with timestamp
        updated.unshift({
            courseId,
            timestamp: new Date().toISOString(),
            viewDate: new Date().toLocaleDateString()
        });
        
        // Keep only last 50 items
        updated = updated.slice(0, 50);
        
        setViewHistory(updated);
        localStorage.setItem(key, JSON.stringify(updated));
    };

    const getViewHistory = () => viewHistory;

    const clearViewHistory = () => {
        const key = user ? `viewHistory_${user.id}` : 'viewHistory_guest';
        setViewHistory([]);
        localStorage.removeItem(key);
    };

    const value = {
        currency,
        allCourses, 
        caculateRating,
        calculateRating,
        isEducator, 
        setIsEducator,
        calculateChapterTime,
        calculateCourseDuration,
        calculateNoOfLectures,
        enrolledCourses,
        setEnrolledCourses,
        addCourseRating,
        getUserRatingForCourse,
        courseRatings,
        ratingUpdateTrigger,
        getTotalReviewCount,
        favoriteCourses,
        toggleFavoriteCourse,
        isCourseFavorite,
        getFavoriteCourses,
        getUserRatingsKey,
        viewHistory,
        addToViewHistory,
        getViewHistory,
        clearViewHistory
    };
    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export { AppContext, AppProvider }