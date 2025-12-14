import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, confirmColor }) => {
    if (!isOpen) return null;

    const baseStyle = "px-4 py-2 text-sm rounded-lg transition duration-150";

    return (
        // Overlay (Lớp phủ mờ)
        <div
            className="fixed inset-0 z-50 bg-opacity-10 flex justify-center items-center"
            style={{ backdropFilter: 'blur(6px)' }} 
        >
            {/* Modal Box */}
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4 transform transition-all">
                <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">{title}</h3>

                <div className="text-gray-600 mb-6">{message}</div>

                <div className="flex justify-end space-x-3">
                    {/* Nút Hủy */}
                    <button
                        onClick={onClose}
                        className={`${baseStyle} bg-gray-200 text-gray-700 hover:bg-gray-300`}
                    >
                        Cancel
                    </button>

                    {/* Nút Xác nhận */}
                    <button
                        onClick={onConfirm}
                        className={`${baseStyle} text-white ${confirmColor} hover:opacity-90`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;