const CLOUDINARY_BASE_URL =
	"https://res.cloudinary.com/infiniteapps/image/upload/";

const buildCloudinaryUrl = (publicId) =>
	publicId ? `${CLOUDINARY_BASE_URL}${publicId}` : "";

export const resolveImageUrl = (image, { preferCloudinary = true } = {}) => {
	if (!image) return "";
	if (typeof image === "string") return image;
	if (Array.isArray(image.images) && image.images.length > 0) {
		return resolveImageUrl(image.images[0], { preferCloudinary });
	}

	const cloudinary =
		image.cloudinary_url ||
		image.cloudinaryUrl ||
		image.cloudinaryURL ||
		image.cloudinary_url;
	const cloudinaryId =
		image.cloudinary_public_id ||
		image.cloudinaryPublicId ||
		image.public_id ||
		image.publicId;
	const primary = image.url || image.src;
	const derivedCloudinary = cloudinary || buildCloudinaryUrl(cloudinaryId);

	if (preferCloudinary && derivedCloudinary) {
		return derivedCloudinary;
	}

	return primary || derivedCloudinary || "";
};

export const resolveImageSources = (image) => {
	const primary = resolveImageUrl(image, { preferCloudinary: true });
	const fallback = resolveImageUrl(image, { preferCloudinary: false });
	if (primary && fallback && primary !== fallback) {
		return { primary, fallback };
	}
	return { primary: primary || fallback, fallback: fallback || primary };
};
