const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadFile = async (file, folder = 'uploads') => {
    if (!file) return null;

    if (!CLOUDINARY_URL || !CLOUDINARY_PRESET) {
        console.error("Cloudinary credentials are missing in environment variables.");
        return null;
    }

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_PRESET);
        formData.append('folder', folder);

        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Cloudinary upload failed: ${errorData.error.message}`);
        }

        const data = await response.json();
        return data.secure_url; 

    } catch (error) {
        console.error('Error during file upload:', error);
        return null;
    }
};