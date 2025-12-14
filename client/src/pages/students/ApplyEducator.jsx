import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { uploadFile } from '../../utils/fileUploader';
import api from '../../utils/api';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { FileText } from 'lucide-react';

const ApplyEducator = () => {
    const navigate = useNavigate();
    const { user, isLoaded } = useUser();

    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (selectedFile) {
            const url = URL.createObjectURL(selectedFile);
            setFilePreviewUrl(url);

            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setFilePreviewUrl(null);
        }
    }, [selectedFile]);

    if (!isLoaded) {
        return <div className="text-center py-10">Loading user info...</div>;
    }

    if (!user) {
        navigate('/');
        return null;
    }

    const applicationStatus = user.publicMetadata.applicationStatus || 'none';
    const rejectionReason = user.publicMetadata.rejectionReason || 'No reason provided.';

    if (applicationStatus === 'pending') {
        return (
            <div className="max-w-xl mx-auto p-8 bg-yellow-50 border border-yellow-200 rounded-lg shadow-md mt-10 text-center">
                <h2 className="text-2xl font-bold text-yellow-800 mb-3">Application Pending Review</h2>
                <p className="text-yellow-700">
                    You have applied to become an Educator.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    Return to homepage
                </button>
            </div>
        );
    }

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setMessage('');
        setIsError(false);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setMessage('Please choose the application.');
        setIsError(false);

        const fileInput = document.getElementById('resume');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!selectedFile) {
            toast.error('Please select CV file (PDF or DOCX).');
            return;
        }

        setIsLoading(true);
        setMessage('');
        setIsError(false);

        try {
            setMessage('CV is being uploaded...');
            const resumeUrl = await uploadFile(selectedFile, 'resumes');

            if (!resumeUrl) {
                throw new Error('Unable to upload CV.');
            }

            setMessage('Uploading CV...');
            const responseData = await api.post('/api/user/apply-educator', { resumeUrl });

            if (responseData && responseData.success) {
                await user.reload();

                toast.success('Application has been submitted successfully! Please wait for Admin to review.');
                navigate('/');
            } else {
                throw new Error(responseData?.message || 'Lỗi khi gửi đơn do server trả về.');
            }

        } catch (error) {
            console.error('Submission error:', error);
            const errorMessage = error.message || error.toString();
            toast.error(`Submission Error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 md:p-10 bg-white shadow-xl rounded-xl mt-10">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">
                {applicationStatus === 'rejected' ? 'Re-apply to become an Educator' : 'Sign up to become an educator'}
            </h1>
            {applicationStatus === 'rejected' && (
                <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm animate-pulse-once">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            {/* Icon Error */}
                            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-bold text-red-800">
                                Your previous application was rejected.
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p className="font-semibold">Admin Reason:</p>
                                <p className="italic bg-white/50 p-2 rounded mt-1 border border-red-100">
                                    "{rejectionReason || 'No specific reason provided.'}"
                                </p>
                            </div>
                            <p className="mt-3 text-xs text-red-600 font-medium">
                                Please update your CV and submit again below.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <p className="text-gray-600 mb-6">
                To become a member, please upload your CV (resume). Admin will review the application and notify you of the results via email.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="resume" className="block text-lg font-medium text-gray-700 mb-2">
                        Upload CV/Resume (PDF, DOCX)
                    </label>

                    {!selectedFile || isLoading ? (
                        <input
                            type="file"
                            id="resume"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            disabled={isLoading}
                        />
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50 space-y-2 sm:space-y-0">
                            <span className="text-sm font-medium text-gray-700 truncate sm:mr-4 w-full sm:w-auto">
                                <FileText className="inline-block mr-2" size={16} />{selectedFile.name}
                            </span>
                            <div className='flex items-center gap-3'>
                                {/* NÚT REVIEW MỚI: Sử dụng filePreviewUrl */}
                                <a
                                    href={filePreviewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                    Review CV
                                </a>

                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="flex items-center text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {message && (
                    <div className={`p-3 rounded-lg text-sm ${isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <button
                    type="submit"
                    className={`w-full py-3 px-4 border border-transparent rounded-lg text-white text-lg font-semibold transition duration-300 ${!selectedFile || isLoading || applicationStatus === 'pending'
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-md'
                        }`}
                    disabled={!selectedFile || isLoading || applicationStatus === 'pending'}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                        </div>
                    ) : (
                        applicationStatus === 'rejected' ? 'Resubmit Application' : 'Send CV & Apply'
                    )}
                </button>
            </form>
        </div>
    );
};

export default ApplyEducator;