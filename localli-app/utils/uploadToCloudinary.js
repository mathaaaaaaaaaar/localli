// utils/uploadToCloudinary.js
export const uploadToCloudinary = async (imageUri) => {
  const data = new FormData();
  data.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'avatar.jpg',
  });
    data.append('upload_preset', 'localli');
    data.append('cloud_name', 'dsdjq6hmt');

  const res = await fetch('https://api.cloudinary.com/v1_1/dsdjq6hmt/image/upload', {
    method: 'POST',
    body: data,
  });

  const result = await res.json();
  return result.secure_url;
};