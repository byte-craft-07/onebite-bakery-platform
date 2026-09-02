export const cloudinaryService = {
  /**
   * Upload image file directly to Cloudinary
   */
  async uploadImage(file: File): Promise<string> {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    if (cloudName && cloudName !== "your_cloudinary_cloud_name") {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "theonlinebakery_preset");

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          return data.secure_url;
        }
      } catch (_err) {
        // Fallback
      }
    }

    // Local Data URL fallback if Cloudinary API key is not configured
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  },
};
