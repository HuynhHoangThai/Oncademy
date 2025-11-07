import React, {useEffect, useRef,useState} from 'react'
import Uniqid from 'uniqid'
import Quill from 'quill'
import 'quill/dist/quill.snow.css';
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify';

const AddCourse = () => {

  const {backendUrl, getToken} = useContext(AppContext);
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const [courseTitle, setCourseTitle] = useState('')
  const [coursePrice, setCoursePrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [image, setImage] = useState(null)
  const [chapters, setChapters] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  
  const [lectureDetails, setLectureDetails] = useState({
    lectureTitle: '',
    lectureDuration: 0,
    lectureUrl: '',
    isPreviewFree: false,
  })
  const [courseDescription, setCourseDescription] = useState('');
  const handleChapter = (action, chapterId) => {
    if (action === 'add') {
      const title = prompt('Enter Chapter Name:');
      if (title) {
        const newChapter = {
          chapterId: Uniqid(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder: chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === 'remove') {
      setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId));
    } else if (action === 'toggle') {
      setChapters(
        chapters.map((chapter) =>
          chapter.chapterId === chapterId ? { ...chapter, collapsed: !chapter.collapsed } : chapter
        )
      );
    }
  };
    const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === 'add') {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === 'remove') {
      setChapters(
        chapters.map((chapter) => {
          if (chapter.chapterId === chapterId) {
            chapter.chapterContent.splice(lectureIndex, 1);
          }
          return chapter;
        })
      );
    }
  };
    const addLecture = () => {
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          const newLecture = {
            ...lectureDetails,
            lectureOrder: chapter.chapterContent.length > 0 ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1 : 1,
            lectureId: Uniqid()
          };
          chapter.chapterContent.push(newLecture);
        }
        return chapter;
      })
    );
    setShowPopup(false);
    setLectureDetails({
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false,
    });
  };
  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      if (!image){
        toast.error(error.message);
      }

      const courseData = {
        courseTitle,
        courseDescription: quillRef.current.root.innerHTML,
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        courseContent: chapters,
      }
      const formData = new FormData();
      formData.append('courseData', JSON.stringify(courseData));
      formData.append('image', image);

      const token = await getToken();
      const {data} = await axios.post(backendUrl + '/api/educator/add-course',
        formData,
        {headers: {Authorization: `Bearer ${token}`}})

      if(data.success) {
        toast.success(data.message);
        setCourseTitle('');
        setCoursePrice(0);
        setDiscount(0);
        setImage(null);
        setChapters([]);
        quillRef.current.root.innerHTML = "";
      }else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    
  }
 useEffect(() => {
    
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
      });
      quillRef.current.on('text-change', () => {
        setCourseDescription(quillRef.current.root.innerHTML);
      });
    }
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-2 text-center">Create a New Course</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Course Title */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Course Title</label>
            <input onChange={e => setCourseTitle(e.target.value)} value={courseTitle} type="text" placeholder="Type here" className="outline-none py-3 px-4 rounded-lg border border-gray-300 focus:border-blue-400 w-full text-lg" required />
          </div>
          {/* Course Description */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Course Description</label>
            <div ref={editorRef} className="bg-gray-50 rounded-lg border border-gray-200 min-h-[120px]" style={{minHeight:180}} />
          </div>
          {/* Price & Thumbnail */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-gray-700 font-semibold mb-1">Course Price</label>
              <input onChange={e => setCoursePrice(e.target.value)} value={coursePrice} type="number" placeholder="0" className="outline-none py-3 px-4 rounded-lg border border-gray-300 focus:border-blue-400 w-full text-lg" required />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 font-semibold mb-1">Course Thumbnail</label>
              <label htmlFor="thumbnailImage" className="flex items-center gap-3 cursor-pointer">
                <img src={assets.file_upload_icon} alt="Upload" className="p-3 bg-blue-500 rounded shadow" />
                <input type="file" id="thumbnailImage" onChange={e => setImage(e.target.files[0])} accept="image/*" hidden />
                {image && <img className="max-h-14 rounded shadow" src={URL.createObjectURL(image)} alt="thumbnail preview" />}
                {!image && <span className="text-gray-400">No file chosen</span>}
              </label>
            </div>
          </div>
          {/* Discount */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Discount %</label>
            <input onChange={e => setDiscount(e.target.value)} value={discount} type="number" placeholder="0" min={0} max={100} className="outline-none py-3 px-4 rounded-lg border border-gray-300 focus:border-blue-400 w-32 text-lg" required />
          </div>
          {/* Chapters & Lectures */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-blue-700">Course Structure</h2>
              <button type="button" onClick={() => handleChapter('add')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition">+ Add Chapter</button>
            </div>
            <div className="space-y-4">
              {chapters.map((chapter, chapterIndex) => (
                <div key={chapter.chapterId} className="bg-white border rounded-lg shadow-sm">
                  <div className="flex justify-between items-center p-4 border-b">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleChapter('toggle', chapter.chapterId)} className="focus:outline-none">
                        <img src={assets.dropdown_icon} width={18} alt="toggle" className={`transition-transform ${chapter.collapsed ? 'rotate-90' : ''}`} />
                      </button>
                      <span className="font-semibold text-gray-800">{chapterIndex + 1}. {chapter.chapterTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{chapter.chapterContent.length} lectures</span>
                      <button type="button" onClick={() => handleChapter('remove', chapter.chapterId)} className="hover:bg-red-100 p-1 rounded">
                        <img src={assets.cross_icon} alt="Remove" width={18} />
                      </button>
                    </div>
                  </div>
                  {!chapter.collapsed && (
                    <div className="p-4 space-y-2">
                      {chapter.chapterContent.map((lecture, lectureIndex) => (
                        <div key={lecture.lectureId} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
                          <span className="text-gray-700">{lectureIndex + 1}. {lecture.lectureTitle} - {lecture.lectureDuration} mins - <a href={lecture.lectureUrl} target="_blank" className="text-blue-500 underline">Link</a> - {lecture.isPreviewFree ? <span className="text-green-600 font-medium">Free Preview</span> : <span className="text-gray-400">Paid</span>}</span>
                          <button type="button" onClick={() => handleLecture('remove', chapter.chapterId, lectureIndex)} className="hover:bg-red-100 p-1 rounded">
                            <img src={assets.cross_icon} alt="Remove" width={16} />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => handleLecture('add', chapter.chapterId)} className="inline-flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded mt-2 font-medium transition">
                        + Add Lecture
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {chapters.length === 0 && <div className="text-gray-400 text-center py-4">No chapters added yet.</div>}
            </div>
          </div>
          {/* Submit Button */}
          <button type="submit" className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg transition">Create Course</button>
        </form>
      </div>
      {/* Popup Add Lecture */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative">
            <button onClick={() => setShowPopup(false)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-xl">&times;</button>
            <h2 className="text-xl font-bold mb-4 text-blue-700">Add Lecture</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Lecture Title</label>
                <input type="text" className="block w-full border rounded py-2 px-3 outline-none focus:border-blue-400" value={lectureDetails.lectureTitle} onChange={e => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })} />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Lecture Duration (minutes)</label>
                <input type="number" className="block w-full border rounded py-2 px-3 outline-none focus:border-blue-400" value={lectureDetails.lectureDuration} onChange={e => setLectureDetails({ ...lectureDetails, lectureDuration: e.target.value })} />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Lecture URL</label>
                <input type="text" className="block w-full border rounded py-2 px-3 outline-none focus:border-blue-400" value={lectureDetails.lectureUrl} onChange={e => setLectureDetails({ ...lectureDetails, lectureUrl: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPreviewFree" checked={lectureDetails.isPreviewFree} onChange={e => setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })} />
                <label htmlFor="isPreviewFree" className="text-gray-700">Free Preview</label>
              </div>
              <button onClick={addLecture} className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg mt-2">Add Lecture</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddCourse
