// utils/uploadToCloudinary.js
export const uploadToCloudinary = async (imageUri) => {
  try {
    console.log('📤 Starting upload to Cloudinary...');
    console.log('🖼️ Image URI:', imageUri);

    const formData = new FormData();

    const file = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    };

    console.log('📦 File object:', file);

    formData.append('file', file);
    formData.append('upload_preset', 'localli');
    formData.append('cloud_name', 'dsdjq6hmt');

    console.log('🧾 FormData prepared. Uploading to Cloudinary...');

    const response = await fetch('https://api.cloudinary.com/v1_1/dsdjq6hmt/image/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = await response.json();
    console.log('✅ Cloudinary Response:', result);

    if (result.secure_url) {
      console.log('🌐 Image uploaded successfully:', result.secure_url);
      return result.secure_url;
    } else {
      console.error('❌ Upload failed with error:', result);
      throw new Error('Upload failed: ' + JSON.stringify(result));
    }
  } catch (err) {
    console.error('🚨 Error during Cloudinary upload:', err);
    throw err;
  }
};