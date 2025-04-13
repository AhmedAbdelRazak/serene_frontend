import React, { useEffect, useState, useRef, useMemo } from "react";
import styled from "styled-components";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
	Button,
	Row,
	Col,
	Typography,
	Input,
	Select,
	message,
	Skeleton,
	Divider,
	Popover,
	InputNumber,
	Modal,
	Spin,
} from "antd";
import Slider from "react-slick";
import { useDropzone } from "react-dropzone";
import {
	DeleteOutlined,
	FontColorsOutlined,
	BoldOutlined,
	ItalicOutlined,
	BgColorsOutlined,
	UpOutlined,
	DownOutlined,
	ShoppingCartOutlined,
	EditOutlined,
	CloudUploadOutlined,
	ReloadOutlined,
	CameraOutlined,
} from "@ant-design/icons";
import PrintifyCheckoutModal from "./PrintifyCheckoutModal";
import { isAuthenticated } from "../../auth";
import { cloudinaryUpload1 } from "../../apiCore";

import html2canvas from "html2canvas";
import { useCartContext } from "../../cart_context";
import { Rnd } from "react-rnd";
import { Helmet } from "react-helmet";

// GA 4
import ReactGA from "react-ga4";

// heic2any for .heic → jpeg
import heic2any from "heic2any";

// Fallback library for final image conversion
import domtoimage from "dom-to-image-more";

// ----------- ADDED: import the child -----------
import AnimationPODWalkThrough from "../MyAnimationComponents/AnimationPODWalkThrough";

const { Title } = Typography;
const { Option } = Select;

//Ensure that the sizes and colors are changing
//Finish the upload photo through the animation
//Ensure that the component with the animation is responsive

/**
 * ------------------------------------------------------------------------
 * NOTE about "findDOMNode is deprecated":
 * ------------------------------------------------------------------------
 * This warning arises from react-rnd’s internal usage of findDOMNode.
 * If it bothers you, remove StrictMode in your React root or upgrade react-rnd
 * to a version that no longer uses findDOMNode.
 */

/**
 * ------------------------------------------------------------------------
 * A) PERMISSION HELPER
 * ------------------------------------------------------------------------
 */
async function requestImagePermissions() {
	try {
		if (navigator?.mediaDevices?.getUserMedia) {
			await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment" },
				audio: false,
			});
			console.log("Camera permission requested as last fallback…");
		}
	} catch (err) {
		console.warn(
			"User denied or device not supported for camera permission:",
			err
		);
	}
}

/**
 * ------------------------------------------------------------------------
 * B) HELPER FUNCTIONS
 * ------------------------------------------------------------------------
 */
function stripHtmlTags(html) {
	if (!html) return "";
	return html.replace(/<[^>]*>?/gm, "");
}

function truncateText(text, wordLimit) {
	const words = text.split(/\s+/);
	if (words.length <= wordLimit) return text;
	return words.slice(0, wordLimit).join(" ") + "...";
}

/**
 * We pass `willReadFrequently: true` to suppress the “Canvas2D multiple readback…” warning
 */
function cropCanvasToTransparentBounds(originalCanvas) {
	const ctx = originalCanvas.getContext("2d", { willReadFrequently: true });
	const { width, height } = originalCanvas;
	const imageData = ctx.getImageData(0, 0, width, height).data;

	let top = 0,
		bottom = height,
		left = 0,
		right = width;

	// top
	topLoop: for (; top < height; top++) {
		for (let x = 0; x < width; x++) {
			const idx = (top * width + x) * 4 + 3;
			if (imageData[idx] !== 0) break topLoop;
		}
	}
	// bottom
	bottomLoop: for (; bottom > top; bottom--) {
		for (let x = 0; x < width; x++) {
			const idx = ((bottom - 1) * width + x) * 4 + 3;
			if (imageData[idx] !== 0) break bottomLoop;
		}
	}
	// left
	leftLoop: for (; left < width; left++) {
		for (let y = top; y < bottom; y++) {
			const idx = (y * width + left) * 4 + 3;
			if (imageData[idx] !== 0) break leftLoop;
		}
	}
	// right
	rightLoop: for (; right > left; right--) {
		for (let y = top; y < bottom; y++) {
			const idx = (y * width + (right - 1)) * 4 + 3;
			if (imageData[idx] !== 0) break rightLoop;
		}
	}

	const croppedWidth = right - left;
	const croppedHeight = bottom - top;
	if (croppedWidth <= 0 || croppedHeight <= 0) {
		return originalCanvas; // everything is transparent => return original
	}
	const newCanvas = document.createElement("canvas");
	newCanvas.width = croppedWidth;
	newCanvas.height = croppedHeight;
	const newCtx = newCanvas.getContext("2d", { willReadFrequently: true });
	newCtx.putImageData(
		ctx.getImageData(left, top, croppedWidth, croppedHeight),
		0,
		0
	);
	return newCanvas;
}

function dataURLtoBlob(dataURL) {
	const [metadata, base64] = dataURL.split(",");
	const byteString = atob(base64);
	const mimeString = metadata.split(":")[1].split(";")[0];
	const buffer = new ArrayBuffer(byteString.length);
	const view = new Uint8Array(buffer);
	for (let i = 0; i < byteString.length; i++) {
		view[i] = byteString.charCodeAt(i);
	}
	return new Blob([buffer], { type: mimeString });
}

function compressCanvas(canvas, { mimeType = "image/jpeg", quality = 0.9 }) {
	return new Promise((resolve, reject) => {
		if (canvas.toBlob) {
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						return reject(new Error("Canvas is empty or toBlob() failed."));
					}
					const reader = new FileReader();
					reader.onload = () => resolve(reader.result);
					reader.onerror = (err) => reject(err);
					reader.readAsDataURL(blob);
				},
				mimeType,
				quality
			);
		} else {
			// fallback for older browsers
			try {
				const dataURL = canvas.toDataURL(mimeType, quality);
				const blob = dataURLtoBlob(dataURL);
				const reader = new FileReader();
				reader.onload = () => resolve(reader.result);
				reader.onerror = (err) => reject(err);
				reader.readAsDataURL(blob);
			} catch (error) {
				return reject(error);
			}
		}
	});
}

/**
 * If .heic => convert it to JPEG
 */
async function convertHeicToJpegIfNeeded(file) {
	const fileType = file.type?.toLowerCase() || "";
	const fileName = file.name?.toLowerCase() || "";

	if (!fileType.includes("heic") && !fileName.endsWith(".heic")) {
		return file;
	}
	try {
		const convertedBlob = await heic2any({
			blob: file,
			toType: "image/jpeg",
			quality: 0.9,
		});
		const convertedFile = new File(
			[convertedBlob],
			file.name.replace(/\.heic$/i, ".jpg"),
			{
				type: "image/jpeg",
				lastModified: Date.now(),
			}
		);
		return convertedFile;
	} catch (err) {
		console.warn("HEIC conversion failed. Using original file:", err);
		return file;
	}
}

/**
 * Fallback #1: draw file to <canvas>
 */
async function fallbackCanvasConvert(file) {
	if (
		file.type?.toLowerCase().includes("video") ||
		file.name?.endsWith(".mov")
	) {
		throw new Error(
			"This file is a video/Live Photo. Cannot convert to image."
		);
	}
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext("2d", { willReadFrequently: true });
				ctx.drawImage(img, 0, 0);
				canvas.toBlob(
					(blob) => {
						if (!blob) return reject(new Error("Canvas toBlob produced null"));
						const newFile = new File([blob], file.name || "fallback.jpg", {
							type: "image/jpeg",
							lastModified: Date.now(),
						});
						resolve(newFile);
					},
					"image/jpeg",
					0.9
				);
			} catch (err) {
				reject(err);
			} finally {
				URL.revokeObjectURL(url);
			}
		};
		img.onerror = (err) => {
			URL.revokeObjectURL(url);
			reject(err);
		};
		img.src = url;
	});
}

/**
 * Fallback #2: use dom-to-image-more
 */
async function fallbackDomToImageConvert(file) {
	return new Promise((resolve, reject) => {
		const containerDiv = document.createElement("div");
		containerDiv.style.position = "absolute";
		containerDiv.style.top = "-9999px";
		containerDiv.style.left = "-9999px";
		containerDiv.style.opacity = "0";
		containerDiv.style.pointerEvents = "none";

		const img = new Image();
		img.crossOrigin = "anonymous";
		img.style.maxWidth = "100%";
		containerDiv.appendChild(img);
		document.body.appendChild(containerDiv);

		const objectURL = URL.createObjectURL(file);
		img.onload = async () => {
			try {
				const blob = await domtoimage.toBlob(containerDiv, {
					style: {
						transform: "scale(1)",
						transformOrigin: "top left",
					},
				});
				const newFile = new File(
					[blob],
					file.name || "fallback-domtoimage.jpg",
					{
						type: "image/jpeg",
						lastModified: Date.now(),
					}
				);
				document.body.removeChild(containerDiv);
				URL.revokeObjectURL(objectURL);
				resolve(newFile);
			} catch (err) {
				document.body.removeChild(containerDiv);
				URL.revokeObjectURL(objectURL);
				reject(err);
			}
		};
		img.onerror = (err) => {
			document.body.removeChild(containerDiv);
			URL.revokeObjectURL(objectURL);
			reject(err);
		};
		img.src = objectURL;
	});
}

/**
 * Plain XHR fallback for uploading
 */
async function fallbackVanillaJSXHRUpload(file, userId, token) {
	return new Promise((resolve, reject) => {
		const formData = new FormData();
		formData.append("image", file);
		formData.append("userId", userId);

		const xhr = new XMLHttpRequest();
		xhr.open(
			"POST",
			`${process.env.REACT_APP_API_URL}/admin/vanilla-upload`,
			true
		);

		xhr.setRequestHeader("Authorization", `Bearer ${token}`);

		xhr.onload = function () {
			if (xhr.status === 200) {
				try {
					const data = JSON.parse(xhr.responseText);
					if (data && data.public_id && data.url) {
						resolve({ public_id: data.public_id, url: data.url });
					} else {
						reject(
							new Error("Vanilla XHR: Missing public_id or url in response.")
						);
					}
				} catch (e) {
					reject(new Error("Vanilla XHR: Could not parse JSON response."));
				}
			} else {
				reject(
					new Error(`Vanilla XHR: Upload failed with status ${xhr.status}`)
				);
			}
		};

		xhr.onerror = function () {
			reject(new Error("Vanilla XHR: Network error or CORS blocked."));
		};

		xhr.send(formData);
	});
}

/**
 * Plain XHR fallback for screenshot
 */
async function fallbackVanillaJSXHRUploadScreenshot(blob, userId, token) {
	return new Promise((resolve, reject) => {
		const formData = new FormData();
		formData.append("image", blob, "screenshot.jpg");
		formData.append("userId", userId);

		const xhr = new XMLHttpRequest();
		xhr.open(
			"POST",
			`${process.env.REACT_APP_API_URL}/admin/vanilla-upload`,
			true
		);
		xhr.setRequestHeader("Authorization", `Bearer ${token}`);

		xhr.onload = function () {
			if (xhr.status === 200) {
				try {
					const data = JSON.parse(xhr.responseText);
					if (data && data.public_id && data.url) {
						resolve({ public_id: data.public_id, url: data.url });
					} else {
						reject(
							new Error("Vanilla XHR screenshot: Missing public_id or url")
						);
					}
				} catch (e) {
					reject(
						new Error("Vanilla XHR screenshot: Could not parse JSON response.")
					);
				}
			} else {
				reject(new Error(`Vanilla XHR screenshot: status ${xhr.status}`));
			}
		};
		xhr.onerror = function () {
			reject(new Error("Vanilla XHR screenshot: Network error or CORS?"));
		};

		xhr.send(formData);
	});
}

/**
 * ------------------------------------------------------------------------
 * C) COMPONENT
 * ------------------------------------------------------------------------
 */
export default function CustomizeSelectedProduct() {
	const { productId } = useParams();
	const [product, setProduct] = useState(null);
	const [loading, setLoading] = useState(true);

	const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
	const [selectedColor, setSelectedColor] = useState("");
	const [selectedSize, setSelectedSize] = useState("");

	// Current text styling
	const [userText, setUserText] = useState("");
	const [textColor, setTextColor] = useState("#000000");
	const [fontFamily, setFontFamily] = useState("Arial");
	const [fontSize, setFontSize] = useState(24);
	const [fontWeight, setFontWeight] = useState("normal");
	const [fontStyle, setFontStyle] = useState("normal");
	const [borderRadius, setBorderRadius] = useState(0);

	// All design elements (text/images)
	const [elements, setElements] = useState([]);
	const [selectedElementId, setSelectedElementId] = useState(null);
	const [inlineEditId, setInlineEditId] = useState(null);
	const [inlineEditText, setInlineEditText] = useState("");

	const [order, setOrder] = useState({
		product_id: null,
		variant_id: null,
		customizations: { texts: [], images: [] },
		recipient: {
			name: "",
			address1: "",
			city: "",
			state: "",
			zip: "",
			country: "",
			phone: "",
			email: "",
		},
		shipping_method: "",
	});
	const [userJustSingleClickedText, setUserJustSingleClickedText] =
		useState(false);

	const [isMobile, setIsMobile] = useState(window.innerWidth < 800);
	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 800);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const { addToCart, openSidebar2 } = useCartContext();
	const { user, token } = isAuthenticated();

	// If user/token missing, fallback:
	const fallbackUserId = user?._id || "663539b4eb1a090ebd349d65";
	const fallbackToken = token || "token";

	// Refs for screenshot
	const sliderRef = useRef(null);
	const designOverlayRef = useRef(null);
	const bareDesignRef = useRef(null);
	const printAreaRef = useRef(null);
	const barePrintAreaRef = useRef(null);

	// For mobile text modal
	const [textModalVisible, setTextModalVisible] = useState(false);
	const [mobileTextInput, setMobileTextInput] = useState("");

	// For separate "gallery" vs "camera"
	const hiddenGalleryInputRef = useRef(null);
	const hiddenCameraInputRef = useRef(null);

	// Desktop drag/drop
	const { getRootProps, getInputProps } = useDropzone({
		accept: {
			"image/*": [
				".jpg",
				".jpeg",
				".png",
				".gif",
				".webp",
				".heic",
				".HEIC",
				".heif",
				".HEIF",
			],
		},
		onDrop: (acceptedFiles) => {
			try {
				if (ReactGA && typeof ReactGA.event === "function") {
					ReactGA.event({
						category: "User Uploaded Image In Custom Design",
						action: "User Uploaded Image In Custom Design",
						label: "User Uploaded Image In Custom Design",
					});
				}
			} catch {}
			acceptedFiles.forEach((file) => addImageElement(file));
		},
	});

	const [isAddToCartDisabled, setIsAddToCartDisabled] = useState(false);
	const [showTooltipForText, setShowTooltipForText] = useState(null);
	const [isRotating, setIsRotating] = useState(false);
	const rotationData = useRef({
		rotatingElementId: null,
		startAngle: 0,
		startRotation: 0,
	});
	const [defaultTextAdded, setDefaultTextAdded] = useState(false);

	const [showMobileButtons, setShowMobileButtons] = useState(false);
	useEffect(() => {
		if (isMobile) {
			setTimeout(() => {
				setShowMobileButtons(true);
			}, 1000);
		}
	}, [isMobile]);

	const [uploadingImage, setUploadingImage] = useState(false);

	// ----------- ADDED states to track user actions -----------

	const [didUserAddToCart, setDidUserAddToCart] = useState(false);
	const [hasChangedSizeOrColor, setHasChangedSizeOrColor] = useState(false);
	const [userJustDoubleClickedCanvas, setUserJustDoubleClickedCanvas] =
		useState(false);
	const [hasMultipleSizeOrColor, setHasMultipleSizeOrColor] = useState(false);

	// 1) LOAD PRODUCT
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
		const fetchProduct = async () => {
			try {
				const response = await axios.get(
					`${process.env.REACT_APP_API_URL}/product/${productId}`
				);
				if (!response.data) {
					message.error("Product not found or no data returned.");
					setLoading(false);
					return;
				}
				let fetchedProduct = {
					...response.data,
					variants: response.data.printifyProductDetails?.variants || [],
					options: response.data.printifyProductDetails?.options || [],
					images: response.data.printifyProductDetails?.images || [],
					title:
						response.data.printifyProductDetails?.title ||
						response.data.productName,
					description:
						response.data.printifyProductDetails?.description ||
						response.data.description ||
						"",
				};

				const validVariants = fetchedProduct.variants.filter(
					(variant) => typeof variant.price === "number" && variant.price > 0
				);
				if (!validVariants.length) {
					message.error("No valid variants with pricing were found.");
					setLoading(false);
					return;
				}
				fetchedProduct.variants = validVariants;

				fetchedProduct.options = fetchedProduct.options.map((opt) => {
					const newValues = opt.values.filter((val) =>
						validVariants.some((v) => v.options.includes(val.id))
					);
					return { ...opt, values: newValues };
				});

				setProduct(fetchedProduct);

				// -----------------------------------------
				// ADDITION: check query params for color/size
				// -----------------------------------------
				const queryParams = new URLSearchParams(window.location.search);
				const colorParam = queryParams.get("color");
				const sizeParam = queryParams.get("size");

				const colorOption = fetchedProduct.options.find(
					(opt) => opt.name.toLowerCase() === "colors"
				);
				const sizeOption = fetchedProduct.options.find(
					(opt) => opt.name.toLowerCase() === "sizes"
				);

				// If we have colorOption:
				if (colorOption?.values?.length) {
					if (
						colorParam &&
						colorOption.values.some((val) => val.title === colorParam)
					) {
						setSelectedColor(colorParam);
					} else {
						setSelectedColor(colorOption.values[0].title);
					}
				} else {
					setSelectedColor("");
				}

				// If we have sizeOption:
				if (sizeOption?.values?.length) {
					if (
						sizeParam &&
						sizeOption.values.some((val) => val.title === sizeParam)
					) {
						setSelectedSize(sizeParam);
					} else {
						const defVar = validVariants.find((v) => v.is_default);
						if (defVar) {
							const defSizeVal = sizeOption.values.find((sv) =>
								defVar.options.includes(sv.id)
							);
							if (defSizeVal) {
								setSelectedSize(defSizeVal.title);
							} else {
								setSelectedSize(sizeOption.values[0].title);
							}
						} else {
							setSelectedSize(sizeOption.values[0].title);
						}
					}
				} else {
					setSelectedSize("");
				}
				// -----------------------------------------
				// END of addition
				// -----------------------------------------

				setLoading(false);
			} catch (err) {
				console.error(err);
				message.error("Failed to load product details.");
				setLoading(false);
			}
		};
		fetchProduct();
	}, [productId]);

	useEffect(() => {
		if (!product) return;

		// Find the color & size option
		const colorOption = product.options.find(
			(opt) => opt.name.toLowerCase() === "colors"
		);
		const sizeOption = product.options.find(
			(opt) => opt.name.toLowerCase() === "sizes"
		);

		const multipleColors = colorOption?.values?.length > 1;
		const multipleSizes = sizeOption?.values?.length > 1;

		// If we have >1 color or >1 size => true
		if (multipleColors || multipleSizes) {
			setHasMultipleSizeOrColor(true);
		} else {
			setHasMultipleSizeOrColor(false);
		}
	}, [product]);

	// Add a default text box in the middle
	useEffect(() => {
		if (!product || defaultTextAdded) return;
		if (!printAreaRef.current) return;

		const boundingRect = printAreaRef.current.getBoundingClientRect();
		const boxWidth = 200;
		const boxHeight = 100;

		const centerX = boundingRect.width / 2 - boxWidth / 2;
		const centerY = boundingRect.height / 2 - boxHeight / 1;

		const newEl = {
			id: Date.now(),
			type: "text",
			text: "Start typing here...",
			color: "#000000",
			backgroundColor: "transparent",
			fontFamily: "Arial",
			fontSize: 20,
			fontWeight: "normal",
			fontStyle: "normal",
			borderRadius: 0,
			rotation: 0,
			x: centerX,
			y: centerY,
			width: boxWidth,
			height: boxHeight,
			wasReset: false,
		};

		setElements((prev) => [...prev, newEl]);
		setDefaultTextAdded(true);
	}, [product, defaultTextAdded]);

	// Whenever color/size changes => update variant_id
	useEffect(() => {
		if (!product) return;

		const colorOption = product.options.find(
			(opt) => opt.name.toLowerCase() === "colors"
		);
		const sizeOption = product.options.find(
			(opt) => opt.name.toLowerCase() === "sizes"
		);

		function numOrStr(val) {
			return typeof val === "number" ? val : parseInt(val, 10);
		}

		let matchingVariant = null;
		if (!colorOption && !sizeOption) {
			matchingVariant = product.variants[0] || null;
		} else if (colorOption && !sizeOption) {
			const selectedColorValue = colorOption.values.find(
				(val) => val.title === selectedColor
			);
			matchingVariant = product.variants.find((variant) => {
				const varOptionIds = variant.options.map(numOrStr);
				return selectedColorValue
					? varOptionIds.includes(numOrStr(selectedColorValue.id))
					: false;
			});
		} else if (!colorOption && sizeOption) {
			const selectedSizeValue = sizeOption.values.find(
				(val) => val.title === selectedSize
			);
			matchingVariant = product.variants.find((variant) => {
				const varOptionIds = variant.options.map(numOrStr);
				return selectedSizeValue
					? varOptionIds.includes(numOrStr(selectedSizeValue.id))
					: false;
			});
		} else if (colorOption && sizeOption) {
			const selectedColorValue = colorOption.values.find(
				(val) => val.title === selectedColor
			);
			const selectedSizeValue = sizeOption.values.find(
				(val) => val.title === selectedSize
			);
			matchingVariant = product.variants.find((variant) => {
				const varOptionIds = variant.options.map(numOrStr);
				return (
					selectedColorValue &&
					selectedSizeValue &&
					varOptionIds.includes(numOrStr(selectedColorValue.id)) &&
					varOptionIds.includes(numOrStr(selectedSizeValue.id))
				);
			});
		}

		setOrder((prev) => ({
			...prev,
			variant_id: matchingVariant?.id || null,
		}));
	}, [product, selectedColor, selectedSize]);

	// If user changes color or size from initial => set hasChangedSizeOrColor
	useEffect(() => {
		// Once changed, we keep it true
		if (!hasChangedSizeOrColor && (selectedColor || selectedSize)) {
			setHasChangedSizeOrColor(true);
		}
	}, [selectedColor, selectedSize, hasChangedSizeOrColor]);

	/**
	 * ------------------------------------------------------------------------
	 * 2) IMAGE UPLOAD LOGIC
	 * ------------------------------------------------------------------------
	 */

	function handleBlankAreaDoubleClick(e) {
		// Make sure the user did NOT double-click on an existing element
		// You can check if e.target.closest('.rnd-element') is null, etc.
		if (!e.target.closest(".rnd-element")) {
			setUserJustDoubleClickedCanvas(true);
			// Optionally reset it after a moment
			setTimeout(() => setUserJustDoubleClickedCanvas(false), 500);
		}
	}

	const addImageElement = async (file) => {
		// If user picks .mov => error
		if (
			file.type?.toLowerCase().includes("video") ||
			file.name?.toLowerCase().endsWith(".mov")
		) {
			message.error(
				"This file is a video/Live Photo. Please select a standard image."
			);
			return;
		}

		setUploadingImage(true);
		try {
			// 1) Convert from HEIC if needed
			let workingFile = await convertHeicToJpegIfNeeded(file);

			// 2) Attempt direct upload
			try {
				await uploadDirectly(workingFile);
			} catch (directErr) {
				console.warn("Direct upload failed; try resizing...", directErr);
				// 3) try resizing => re-upload
				try {
					await handleImageResizingThenUpload(workingFile);
				} catch (resizeErr) {
					console.warn("Resizing failed; fallback to canvas...", resizeErr);
					// 4) fallback => canvas
					try {
						const fallbackFile = await fallbackCanvasConvert(workingFile);
						await uploadDirectly(fallbackFile);
					} catch (canvasErr) {
						console.warn(
							"Canvas fallback also failed; try dom-to-image...",
							canvasErr
						);
						// 5) fallback => dom-to-image
						try {
							const fallbackFile2 =
								await fallbackDomToImageConvert(workingFile);
							await uploadDirectly(fallbackFile2);
						} catch (dom2Err) {
							console.warn(
								"dom-to-image fallback also failed => final attempt vanilla XHR.",
								dom2Err
							);
							// 6) final => plain XHR => THEN ask permission
							try {
								const { public_id, url } = await fallbackVanillaJSXHRUpload(
									workingFile,
									fallbackUserId,
									fallbackToken
								);
								addImageElementToCanvas(public_id, url);
							} catch (vanillaFail) {
								console.error(
									"All fallback attempts for upload failed!",
									vanillaFail
								);

								// =========== ASK PERMISSION & re-try final attempt ===========
								try {
									await requestImagePermissions();
									message.info(
										"Trying final fallback once more with permission granted..."
									);

									const { public_id, url } = await fallbackVanillaJSXHRUpload(
										workingFile,
										fallbackUserId,
										fallbackToken
									);
									addImageElementToCanvas(public_id, url);
								} catch (vanillaPermFail) {
									console.error(
										"Even after permissions, final fallback attempt failed.",
										vanillaPermFail
									);
									message.error(
										"We encountered an issue uploading your image. Please try again or pick a different photo."
									);
								}
								// =============================================================
							}
						}
					}
				}
			}
		} catch (finalErr) {
			console.error("Image upload (all attempts) failed:", finalErr);
			message.error(
				"We encountered an issue uploading your image. Please try again or pick a different photo."
			);
		} finally {
			setUploadingImage(false);
		}
	};

	async function uploadDirectly(file) {
		const base64Image = await convertToBase64(file);
		const { public_id, url } = await cloudinaryUpload1(
			fallbackUserId,
			fallbackToken,
			{
				image: base64Image,
			}
		);
		if (!public_id || !url) {
			throw new Error("Missing public_id or url in direct upload response");
		}
		addImageElementToCanvas(public_id, url);
	}

	async function handleImageResizingThenUpload(file) {
		const resizedFile = await resizeImage(file, 1200);
		const base64Image = await convertToBase64(resizedFile);
		const { public_id, url } = await cloudinaryUpload1(
			fallbackUserId,
			fallbackToken,
			{
				image: base64Image,
			}
		);
		if (!public_id || !url) {
			throw new Error("Missing public_id or url after resizing");
		}
		addImageElementToCanvas(public_id, url);
	}

	function addImageElementToCanvas(public_id, url) {
		if (!printAreaRef.current) return;
		const boundingRect = printAreaRef.current.getBoundingClientRect();
		const imgWidth = 150;
		const imgHeight = 200;
		const centerX = boundingRect.width / 2 - imgWidth / 2;
		const centerY = boundingRect.height / 2 - imgHeight / 2;

		const newId = Date.now();
		const removedBg = removeImageBackground(url);

		const newImgEl = {
			id: newId,
			type: "image",
			src: url,
			public_id,
			rotation: 0,
			x: centerX,
			y: centerY,
			width: imgWidth,
			height: imgHeight,
			borderRadius: 0,
			originalSrc: url,
			removedBgSrc: removedBg,
			bgRemoved: false,
			wasReset: false,
		};
		setElements((prev) => [...prev, newImgEl]);
		setSelectedElementId(newId);
	}

	function removeImageBackground(oldUrl) {
		if (!oldUrl.includes("/upload/")) {
			return oldUrl;
		}
		return oldUrl.replace("/upload/", "/upload/e_background_removal/");
	}

	async function resizeImage(file, maxSize) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const canvas = document.createElement("canvas");
			const reader = new FileReader();

			reader.onload = (e) => {
				img.src = e.target.result;
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);

			img.onload = () => {
				let width = img.width;
				let height = img.height;
				if (width > height && width > maxSize) {
					height = Math.round((height * maxSize) / width);
					width = maxSize;
				} else if (height > width && height > maxSize) {
					width = Math.round((width * maxSize) / height);
					height = maxSize;
				}
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext("2d", { willReadFrequently: true });
				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					(blob) => {
						if (!blob) {
							return reject(new Error("Canvas is empty."));
						}
						const resizedFile = new File([blob], file.name, {
							type: "image/jpeg",
							lastModified: Date.now(),
						});
						resolve(resizedFile);
					},
					"image/jpeg",
					0.9
				);
			};

			img.onerror = (err) => reject(err);
		});
	}

	function convertToBase64(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = (error) => reject(error);
		});
	}

	/**
	 * ------------------------------------------------------------------------
	 * 3) TEXT + ELEMENT EDITING
	 * ------------------------------------------------------------------------
	 */
	function addTextElement(textValue, fromRightSide = false) {
		// If fromRightSide => user used the right-hand box

		const finalText = textValue ? textValue.trim() : userText.trim();
		if (!finalText) {
			message.warning("Please enter some text first.");
			return;
		}
		if (!printAreaRef.current) return;

		const boundingRect = printAreaRef.current.getBoundingClientRect();
		const boxWidth = 200;
		const boxHeight = 100;
		const centerX = boundingRect.width / 2 - boxWidth / 2;
		const centerY = boundingRect.height / 2 - boxHeight / 2;

		const newId = Date.now();
		const newEl = {
			id: newId,
			type: "text",
			text: finalText,
			color: textColor,
			backgroundColor: "transparent",
			fontFamily,
			fontSize,
			fontWeight,
			fontStyle,
			borderRadius,
			rotation: 0,
			x: centerX,
			y: centerY,
			width: boxWidth,
			height: boxHeight,
			wasReset: false,
		};
		setElements((prev) => [...prev, newEl]);
	}

	function handleElementClick(el) {
		// Bring element to top
		setElements((prev) => {
			const rest = prev.filter((item) => item.id !== el.id);
			return [...rest, el];
		});
		setSelectedElementId(el.id);

		if (el.type === "text") {
			setUserJustSingleClickedText(true);
			setUserText(el.text || "");
			setTextColor(el.color || "#000000");
			setFontFamily(el.fontFamily || "Arial");
			setFontSize(el.fontSize || 24);
			setFontWeight(el.fontWeight || "normal");
			setFontStyle(el.fontStyle || "normal");
			setBorderRadius(el.borderRadius || 0);
		} else if (el.type === "image") {
			setBorderRadius(el.borderRadius || 0);
		}
	}

	function handleTextDoubleClick(el) {
		if (el.text === "Start typing here...") {
			setElements((prev) =>
				prev.map((item) => (item.id === el.id ? { ...item, text: "" } : item))
			);
			setInlineEditText("");
		} else {
			setInlineEditText(el.text);
		}
		setInlineEditId(el.id);
	}

	const lastTapTime = useRef(0);
	function handleTextTouchEnd(el) {
		if (!isMobile) return;
		const now = Date.now();
		if (now - lastTapTime.current < 300) {
			handleTextDoubleClick(el);
		}
		lastTapTime.current = now;
	}

	function handleInlineEditSave(elId) {
		setElements((prev) =>
			prev.map((item) =>
				item.id === elId ? { ...item, text: inlineEditText } : item
			)
		);
		setInlineEditId(null);
		setUserJustSingleClickedText(false);
	}

	async function deleteSelectedElement(elId) {
		const el = elements.find((x) => x.id === elId);
		if (!el) return;

		// If it's an image on Cloudinary, remove it
		if (el.type === "image" && el.public_id) {
			try {
				await axios.post(
					`${process.env.REACT_APP_API_URL}/admin/removeimage/${fallbackUserId}`,
					{ public_id: el.public_id },
					{ headers: { Authorization: `Bearer ${fallbackToken}` } }
				);
				message.success("Image Successfully Deleted.");
			} catch (error) {
				console.error("Failed to delete image:", error);
				message.error("Failed to delete image from server.");
			}
		}
		setElements((prev) => prev.filter((item) => item.id !== elId));
		setSelectedElementId(null);
	}

	const [showCenterLine, setShowCenterLine] = useState(false);

	function handleRndDrag(e, data, elId) {
		if (!printAreaRef.current) return;
		const boundingRect = printAreaRef.current.getBoundingClientRect();
		const containerCenterX = boundingRect.width / 2;

		const theElement = elements.find((x) => x.id === elId);
		if (!theElement) return;

		const elementCenterX = data.x + theElement.width / 2;
		const isCentered = Math.abs(elementCenterX - containerCenterX) < 5;
		setShowCenterLine(isCentered);
	}

	function handleRndDragStop(e, data, elId) {
		setShowCenterLine(false);
		setElements((prev) =>
			prev.map((item) =>
				item.id === elId ? { ...item, x: data.x, y: data.y } : item
			)
		);
	}

	function handleRndResizeStop(e, direction, ref, delta, position, elId) {
		const newWidth = parseInt(ref.style.width, 10);
		const newHeight = parseInt(ref.style.height, 10);
		setElements((prev) =>
			prev.map((item) =>
				item.id === elId
					? {
							...item,
							x: position.x,
							y: position.y,
							width: newWidth,
							height: newHeight,
						}
					: item
			)
		);
	}

	const DRAGGABLE_REGION_CLASS = "drag-handle";

	// Rotation
	function onRotationStart(evt, elId) {
		evt.stopPropagation();
		evt.preventDefault();
		rotationData.current.rotatingElementId = elId;
		const el = elements.find((x) => x.id === elId);
		if (!el) return;
		setIsRotating(true);

		const printAreaBounds = printAreaRef.current.getBoundingClientRect();
		const centerX = printAreaBounds.left + el.x + el.width / 2;
		const centerY = printAreaBounds.top + el.y + el.height / 2;

		const pointer = getPointerXY(evt);
		const angleToPointer = Math.atan2(pointer.y - centerY, pointer.x - centerX);
		rotationData.current.startAngle = angleToPointer;
		rotationData.current.startRotation = el.rotation || 0;

		document.addEventListener("mousemove", onRotationMove, { passive: false });
		document.addEventListener("touchmove", onRotationMove, { passive: false });
		document.addEventListener("mouseup", onRotationEnd, { passive: false });
		document.addEventListener("touchend", onRotationEnd, { passive: false });
	}

	function onRotationMove(evt) {
		const { rotatingElementId, startAngle, startRotation } =
			rotationData.current;
		if (!rotatingElementId) return;
		evt.preventDefault();

		const el = elements.find((x) => x.id === rotatingElementId);
		if (!el) return;

		const printAreaBounds = printAreaRef.current.getBoundingClientRect();
		const centerX = printAreaBounds.left + el.x + el.width / 2;
		const centerY = printAreaBounds.top + el.y + el.height / 2;

		const pointer = getPointerXY(evt);
		const angleNow = Math.atan2(pointer.y - centerY, pointer.x - centerX);
		const diff = angleNow - startAngle;
		const newRotationDeg = startRotation + diff * (180 / Math.PI);

		setElements((prev) =>
			prev.map((item) =>
				item.id === rotatingElementId
					? { ...item, rotation: newRotationDeg }
					: item
			)
		);
	}

	function onRotationEnd() {
		setIsRotating(false);
		rotationData.current = {
			rotatingElementId: null,
			startAngle: 0,
			startRotation: 0,
		};
		document.removeEventListener("mousemove", onRotationMove);
		document.removeEventListener("touchmove", onRotationMove);
		document.removeEventListener("mouseup", onRotationEnd);
		document.removeEventListener("touchend", onRotationEnd);
	}

	function getPointerXY(evt) {
		if (evt.touches && evt.touches.length > 0) {
			return { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
		}
		return { x: evt.clientX, y: evt.clientY };
	}

	function getVariantPrice() {
		if (!product || !product.variants) return 0;
		function numOrStr(val) {
			return typeof val === "number" ? val : parseInt(val, 10);
		}
		const colorOption = product.options.find(
			(opt) => opt.name.toLowerCase() === "colors"
		);
		const sizeOption = product.options.find(
			(opt) => opt.name.toLowerCase() === "sizes"
		);

		let matchingVariant = null;
		if (!colorOption && !sizeOption) {
			matchingVariant = product.variants[0];
		} else if (colorOption && !sizeOption) {
			const cVal = colorOption.values.find((v) => v.title === selectedColor);
			matchingVariant = product.variants.find((v) =>
				v.options.map(numOrStr).includes(numOrStr(cVal?.id))
			);
		} else if (!colorOption && sizeOption) {
			const sVal = sizeOption.values.find((v) => v.title === selectedSize);
			matchingVariant = product.variants.find((v) =>
				v.options.map(numOrStr).includes(numOrStr(sVal?.id))
			);
		} else if (colorOption && sizeOption) {
			const cVal = colorOption.values.find((v) => v.title === selectedColor);
			const sVal = sizeOption.values.find((v) => v.title === selectedSize);
			matchingVariant = product.variants.find((v) => {
				const varIds = v.options.map(numOrStr);
				return (
					cVal &&
					sVal &&
					varIds.includes(numOrStr(cVal.id)) &&
					varIds.includes(numOrStr(sVal.id))
				);
			});
		}
		if (matchingVariant && typeof matchingVariant.price === "number") {
			return parseFloat(matchingVariant.price / 100);
		}
		if (typeof product.price === "number") {
			return parseFloat(product.price);
		}
		return 0;
	}
	const displayedPrice = `$${getVariantPrice().toFixed(2)}`;

	const uniqueColorsForDropdown = useMemo(() => {
		if (!product) return [];
		const colorOption = product.options.find(
			(opt) => opt.name.toLowerCase() === "colors"
		);
		if (!colorOption?.values?.length) return [];
		const uniqueTitles = new Set(colorOption.values.map((c) => c.title));
		return Array.from(uniqueTitles);
	}, [product]);

	// Filter images based on color
	const filteredImages = useMemo(() => {
		if (!product) return [];
		if (!selectedColor) {
			return product.images.slice(0, 6);
		}
		const colorOption = product.options.find(
			(opt) => opt.name.toLowerCase() === "colors"
		);
		if (!colorOption) return product.images.slice(0, 6);

		function numOrStr(val) {
			return typeof val === "number" ? val : parseInt(val, 10);
		}
		const colorVal = colorOption.values.find(
			(val) => val.title === selectedColor
		);
		if (!colorVal) return product.images.slice(0, 6);

		const matchingVariants = product.variants.filter((v) => {
			const varIds = v.options.map(numOrStr);
			return varIds.includes(numOrStr(colorVal.id));
		});
		const matchingVariantIds = matchingVariants.map((mv) => mv.id);
		const filtered = product.images.filter((img) =>
			img.variant_ids.some((id) => matchingVariantIds.includes(id))
		);
		return filtered.length ? filtered.slice(0, 6) : product.images.slice(0, 6);
	}, [selectedColor, product]);

	const sliderSettings = {
		ref: sliderRef,
		dots: true,
		infinite: false,
		speed: 500,
		slidesToShow: 1,
		slidesToScroll: 1,
		initialSlide: 0,
		draggable: false,
		swipe: false,
		touchMove: false,
	};
	useEffect(() => {
		if (sliderRef.current) {
			sliderRef.current.slickGoTo(0);
		}
	}, [filteredImages]);

	// Keep order updated
	useEffect(() => {
		const texts = elements
			.filter((el) => el.type === "text")
			.map((el) => ({
				text: el.text,
				color: el.color,
				background_color: el.backgroundColor,
				font_family: el.fontFamily,
				font_size: el.fontSize,
				font_weight: el.fontWeight,
				font_style: el.fontStyle,
				border_radius: el.borderRadius,
				rotation: el.rotation,
				position: { x: el.x, y: el.y },
				was_reset: el.wasReset || false,
			}));
		const images = elements
			.filter((el) => el.type === "image")
			.map((el) => ({
				image_url: el.src,
				position: { x: el.x, y: el.y },
				width: el.width,
				height: el.height,
				rotation: el.rotation,
				border_radius: el.borderRadius || 0,
				bg_removed: el.bgRemoved || false,
				was_reset: el.wasReset || false,
			}));
		setOrder((prev) => ({
			...prev,
			customizations: { texts, images },
		}));
	}, [elements]);

	// Global click => deselect
	useEffect(() => {
		function handleGlobalClick(e) {
			if (!selectedElementId) return;
			if (
				e.target.closest(".rnd-element") ||
				e.target.closest(".text-toolbar") ||
				e.target.closest(".image-toolbar") ||
				e.target.closest(".ant-popover") ||
				e.target.closest(".ant-select-dropdown")
			) {
				return;
			}
			setSelectedElementId(null);
		}
		document.addEventListener("mousedown", handleGlobalClick);
		document.addEventListener("touchstart", handleGlobalClick);
		setUserJustSingleClickedText(true);
		setUserJustSingleClickedText(true);
		return () => {
			document.removeEventListener("mousedown", handleGlobalClick);
			document.removeEventListener("touchstart", handleGlobalClick);
		};
	}, [selectedElementId]);

	const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);

	/**
	 * ------------------------------------------------------------------------
	 * 4) ADD TO CART => SCREENSHOT
	 * ------------------------------------------------------------------------
	 */
	async function handleAddToCart() {
		if (isAddToCartDisabled) return;

		// If no variant_id => must pick color/size
		if (!order.variant_id) {
			message.warning("Please select required options before adding to cart.");
			return;
		}

		setIsAddToCartDisabled(true);

		const previouslySelected = selectedElementId;
		setSelectedElementId(null);
		await new Promise((resolve) => setTimeout(resolve, 50));

		let bareUrl, finalUrl;

		try {
			// #1) Attempt normal html2canvas
			const screenshotOptions = {
				scale: 3,
				useCORS: true,
				allowTaint: false,
				ignoreElements: (element) =>
					element.classList?.contains("noScreenshot"),
				backgroundColor: null,
			};
			if (isMobile) {
				screenshotOptions.scale = 2;
			}

			// bare
			const bareCanvas = await html2canvas(
				bareDesignRef.current,
				screenshotOptions
			);
			const croppedBareCanvas = cropCanvasToTransparentBounds(bareCanvas);
			const bareDataURL = await compressCanvas(croppedBareCanvas, {
				mimeType: "image/jpeg",
				quality: 0.9,
			});
			const bareUpload = await cloudinaryUpload1(
				fallbackUserId,
				fallbackToken,
				{
					image: bareDataURL,
				}
			);
			bareUrl = bareUpload.url;

			// final
			const finalCanvas = await html2canvas(
				designOverlayRef.current,
				screenshotOptions
			);
			const finalDataURL = await compressCanvas(finalCanvas, {
				mimeType: "image/jpeg",
				quality: 0.9,
			});
			const finalUpload = await cloudinaryUpload1(
				fallbackUserId,
				fallbackToken,
				{
					image: finalDataURL,
				}
			);
			finalUrl = finalUpload.url;
		} catch (attemptOneErr) {
			console.warn("Screenshot #1 failed, fallback #2...", attemptOneErr);
			try {
				// #2) Attempt relaxed config
				const fallbackOptions = {
					scale: 2,
					useCORS: false,
					allowTaint: true,
					ignoreElements: (element) =>
						element.classList?.contains("noScreenshot"),
					backgroundColor: null,
				};

				// bare
				const bareCanvas2 = await html2canvas(
					bareDesignRef.current,
					fallbackOptions
				);
				const croppedBare2 = cropCanvasToTransparentBounds(bareCanvas2);
				const bareDataURL2 = await compressCanvas(croppedBare2, {
					mimeType: "image/jpeg",
					quality: 0.85,
				});
				const bareUp2 = await cloudinaryUpload1(fallbackUserId, fallbackToken, {
					image: bareDataURL2,
				});
				bareUrl = bareUp2.url;

				// final
				const finalCanvas2 = await html2canvas(
					designOverlayRef.current,
					fallbackOptions
				);
				const finalDataURL2 = await compressCanvas(finalCanvas2, {
					mimeType: "image/jpeg",
					quality: 0.85,
				});
				const finalUp2 = await cloudinaryUpload1(
					fallbackUserId,
					fallbackToken,
					{
						image: finalDataURL2,
					}
				);
				finalUrl = finalUp2.url;
			} catch (attemptTwoErr) {
				console.warn(
					"Screenshot #2 also failed, fallback #3 (dom-to-image)...",
					attemptTwoErr
				);
				try {
					const domOptions = {
						quality: 0.9,
						bgcolor: null,
						style: {
							transform: "scale(2)",
							transformOrigin: "top left",
						},
						filter: (node) => !node.classList?.contains("noScreenshot"),
					};

					// bare
					const bareBlob3 = await domtoimage.toBlob(
						bareDesignRef.current,
						domOptions
					);
					const bareCanvas3 = await blobToCanvas(bareBlob3);
					const croppedBare3 = cropCanvasToTransparentBounds(bareCanvas3);
					const bareDataURL3 = await compressCanvas(croppedBare3, {
						mimeType: "image/jpeg",
						quality: 0.9,
					});
					const bareUp3 = await cloudinaryUpload1(
						fallbackUserId,
						fallbackToken,
						{
							image: bareDataURL3,
						}
					);
					bareUrl = bareUp3.url;

					// final
					const finalBlob3 = await domtoimage.toBlob(
						designOverlayRef.current,
						domOptions
					);
					const finalCanvas3 = await blobToCanvas(finalBlob3);
					const finalDataURL3 = await compressCanvas(finalCanvas3, {
						mimeType: "image/jpeg",
						quality: 0.9,
					});
					const finalUp3 = await cloudinaryUpload1(
						fallbackUserId,
						fallbackToken,
						{
							image: finalDataURL3,
						}
					);
					finalUrl = finalUp3.url;
				} catch (finalErr) {
					console.warn(
						"dom-to-image also failed => final vanilla XHR fallback",
						finalErr
					);
					try {
						// #4) final final fallback => do XHR => THEN ask for permission
						const fallbackCanvas = document.createElement("canvas");
						fallbackCanvas.width = 300;
						fallbackCanvas.height = 300;
						const ctx = fallbackCanvas.getContext("2d", {
							willReadFrequently: true,
						});
						ctx.fillStyle = "#fff";
						ctx.fillRect(0, 0, 300, 300);

						const screenshotBlob = await new Promise(
							(resolveBlob, rejectBlob) => {
								fallbackCanvas.toBlob(
									(blob) => {
										if (!blob) {
											rejectBlob(
												new Error("Could not create fallback canvas blob")
											);
										} else {
											resolveBlob(blob);
										}
									},
									"image/jpeg",
									0.8
								);
							}
						);

						const { url: fallbackScreenshotUrl } =
							await fallbackVanillaJSXHRUploadScreenshot(
								screenshotBlob,
								fallbackUserId,
								fallbackToken
							);

						bareUrl = fallbackScreenshotUrl;
						finalUrl = fallbackScreenshotUrl;
					} catch (vanillaScreenshotErr) {
						console.error(
							"Even final vanilla screenshot fallback failed",
							vanillaScreenshotErr
						);
						// =========== ASK PERMISSION & re-try final screenshot attempt ============
						try {
							await requestImagePermissions();
							message.info("Retrying screenshot after permission…");

							const fallbackCanvas2 = document.createElement("canvas");
							fallbackCanvas2.width = 300;
							fallbackCanvas2.height = 300;
							const ctx2 = fallbackCanvas2.getContext("2d", {
								willReadFrequently: true,
							});
							ctx2.fillStyle = "#fff";
							ctx2.fillRect(0, 0, 300, 300);

							const screenshotBlob2 = await new Promise(
								(resolveBlob, rejectBlob) => {
									fallbackCanvas2.toBlob(
										(blob) => {
											if (!blob) {
												rejectBlob(
													new Error(
														"Could not create fallback canvas blob again"
													)
												);
											} else {
												resolveBlob(blob);
											}
										},
										"image/jpeg",
										0.8
									);
								}
							);

							const { url: fallbackScreenshotUrl2 } =
								await fallbackVanillaJSXHRUploadScreenshot(
									screenshotBlob2,
									fallbackUserId,
									fallbackToken
								);

							bareUrl = fallbackScreenshotUrl2;
							finalUrl = fallbackScreenshotUrl2;
						} catch (permScreenshotErr) {
							console.error(
								"Last fallback screenshot attempt after permission also failed",
								permScreenshotErr
							);
							message.error(
								"Screenshot attempts all failed. Please refresh or try on another device."
							);
							setSelectedElementId(previouslySelected);
							setIsAddToCartDisabled(false);
							return;
						}
					}
				}
			}
		}

		if (!bareUrl || !finalUrl) {
			message.error(
				"Screenshot attempts all failed. Please refresh or try on another device."
			);
			setSelectedElementId(previouslySelected);
			setIsAddToCartDisabled(false);
			return;
		}

		// If we have bareUrl & finalUrl
		try {
			let variantImage = "";
			let matchingVariant = null;
			function numOrStr(val) {
				return typeof val === "number" ? val : parseInt(val, 10);
			}
			const colorOpt = product?.options?.find(
				(opt) => opt.name.toLowerCase() === "colors"
			);
			const sizeOpt = product?.options?.find(
				(opt) => opt.name.toLowerCase() === "sizes"
			);

			if (product?.options && product?.variants && product?.images) {
				if (!colorOpt && !sizeOpt) {
					matchingVariant = product.variants[0] || null;
				} else if (colorOpt && !sizeOpt) {
					const cVal = colorOpt.values.find(
						(val) => val.title === selectedColor
					);
					matchingVariant = product.variants.find((v) =>
						v.options.map(numOrStr).includes(numOrStr(cVal?.id))
					);
				} else if (!colorOpt && sizeOpt) {
					const sVal = sizeOpt.values.find((val) => val.title === selectedSize);
					matchingVariant = product.variants.find((v) =>
						v.options.map(numOrStr).includes(numOrStr(sVal?.id))
					);
				} else if (colorOpt && sizeOpt) {
					const cVal = colorOpt.values.find(
						(val) => val.title === selectedColor
					);
					const sVal = sizeOpt.values.find((val) => val.title === selectedSize);
					matchingVariant = product.variants.find((v) => {
						const varIds = v.options.map(numOrStr);
						return (
							cVal &&
							sVal &&
							varIds.includes(numOrStr(cVal.id)) &&
							varIds.includes(numOrStr(sVal.id))
						);
					});
				}
				if (matchingVariant) {
					const matchingImageObj = product.images.find((img) =>
						img.variant_ids.includes(matchingVariant.id)
					);
					if (matchingImageObj) {
						variantImage = matchingImageObj.src;
					}
				}
			}

			const firstImageElement = elements.find((el) => el.type === "image");
			const originalPrintifyImageURL =
				variantImage || (firstImageElement ? firstImageElement.src : "");

			let finalPrice = 0;
			let finalPriceAfterDiscount = 0;
			if (matchingVariant && typeof matchingVariant.price === "number") {
				finalPrice = matchingVariant.price / 100;
				finalPriceAfterDiscount = finalPrice;
			} else {
				finalPrice = product.price || 0;
				finalPriceAfterDiscount = product.priceAfterDiscount || finalPrice;
			}

			const customDesign = {
				bareScreenshotUrl: bareUrl,
				finalScreenshotUrl: finalUrl,
				texts: order.customizations.texts,
				images: order.customizations.images,
				originalPrintifyImageURL,
				size: selectedSize,
				color: selectedColor,
				variants: {
					color: colorOpt
						? colorOpt.values.find((c) => c.title === selectedColor)
						: null,
					size: sizeOpt
						? sizeOpt.values.find((s) => s.title === selectedSize)
						: null,
				},
				printArea: "front",
				PrintifyProductId: product.printifyProductDetails?.id || null,
			};

			const chosenProductAttributes = {
				SubSKU: String(Date.now()),
				color: selectedColor,
				size: selectedSize,
				quantity: 999,
				productImages: [],
				price: finalPrice,
				priceAfterDiscount: finalPriceAfterDiscount,
			};

			addToCart(
				product._id,
				selectedColor,
				1,
				product,
				chosenProductAttributes,
				customDesign
			);

			// GA event
			try {
				if (ReactGA && typeof ReactGA.event === "function") {
					ReactGA.event({
						category: "Add To The Cart Custom Products",
						action: "User Added Product From The Custom Products",
						label: `User added ${product.productName} to the cart`,
					});
				}
			} catch {}

			openSidebar2();
			message.success("Added to cart with custom design!");

			// ADDED => user definitely added to cart
			setDidUserAddToCart(true);
		} catch (error) {
			console.error("Screenshot or final upload failed:", error);
			message.error(
				"There was an issue capturing your design screenshot. Please refresh or try again."
			);
		} finally {
			setSelectedElementId(previouslySelected);
			setIsAddToCartDisabled(false);
		}
	}

	async function blobToCanvas(blob) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const url = URL.createObjectURL(blob);
			img.onload = () => {
				const canvas = document.createElement("canvas");
				canvas.width = img.width;
				canvas.height = img.height;
				const ctx = canvas.getContext("2d", { willReadFrequently: true });
				ctx.drawImage(img, 0, 0);
				URL.revokeObjectURL(url);
				resolve(canvas);
			};
			img.onerror = (err) => {
				URL.revokeObjectURL(url);
				reject(err);
			};
			img.src = url;
		});
	}

	function handleRemoveBgToggle(elementId) {
		setElements((prev) =>
			prev.map((item) => {
				if (item.id !== elementId) return item;
				if (item.type !== "image") return item;
				const currentlyRemoved = item.bgRemoved;
				return {
					...item,
					bgRemoved: !currentlyRemoved,
					src: currentlyRemoved ? item.originalSrc : item.removedBgSrc,
				};
			})
		);
	}

	function handleResetStyling(elId) {
		setElements((prev) =>
			prev.map((item) => {
				if (item.id !== elId) return item;
				return {
					...item,
					rotation: 0,
					borderRadius: 0,
					backgroundColor:
						item.type === "text" ? "transparent" : item.backgroundColor,
					wasReset: true,
				};
			})
		);
	}

	// Show tooltip for text
	useEffect(() => {
		if (selectedElementId) {
			const el = elements.find((e) => e.id === selectedElementId);
			if (el && el.type === "text") {
				setShowTooltipForText(selectedElementId);
				const timer = setTimeout(() => {
					setShowTooltipForText(null);
				}, 5000);
				return () => clearTimeout(timer);
			}
		}
		setShowTooltipForText(null);
	}, [selectedElementId, elements]);

	if (loading) {
		return (
			<CustomizeWrapper>
				<Skeleton active />
			</CustomizeWrapper>
		);
	}
	if (!product) {
		return (
			<CustomizeWrapper>
				<Title level={3} style={{ textAlign: "center" }}>
					Product not found.
				</Title>
			</CustomizeWrapper>
		);
	}

	const productDescription = stripHtmlTags(product.description || "");
	const shouldTruncate = productDescription.split(/\s+/).length > 30;
	const displayedDescription =
		shouldTruncate && !isDescriptionExpanded
			? truncateText(productDescription, 30)
			: productDescription;

	function variantExistsForColorSize(sizeObj) {
		if (!product) return false;
		const colorOption = product.options.find(
			(opt) => opt.name.toLowerCase() === "colors"
		);
		const sizeOption = product.options.find(
			(opt) => opt.name.toLowerCase() === "sizes"
		);
		function numOrStr(val) {
			return typeof val === "number" ? val : parseInt(val, 10);
		}
		if (!colorOption && sizeOption) {
			return product.variants.some((v) =>
				v.options.map(numOrStr).includes(numOrStr(sizeObj.id))
			);
		}
		const selColorVal = colorOption?.values.find(
			(val) => val.title === selectedColor
		);
		if (!selColorVal) return false;
		return product.variants.some((v) => {
			const varIds = v.options.map(numOrStr);
			return (
				varIds.includes(numOrStr(selColorVal.id)) &&
				varIds.includes(numOrStr(sizeObj.id))
			);
		});
	}

	function handleColorChange(newColor) {
		setSelectedColor(newColor);
		setHasChangedSizeOrColor(true); // user definitely changed
		const sizeOption = product.options.find(
			(opt) => opt.name.toLowerCase() === "sizes"
		);
		if (sizeOption && sizeOption.values.length) {
			const colorOption = product.options.find(
				(opt) => opt.name.toLowerCase() === "colors"
			);
			const selectedColorValue = colorOption?.values.find(
				(val) => val.title === newColor
			);
			if (!selectedColorValue) return;
			const validVariants = product.variants.filter((v) => {
				const varIds = v.options.map((xx) =>
					typeof xx === "number" ? xx : parseInt(xx, 10)
				);
				return varIds.includes(
					typeof selectedColorValue.id === "number"
						? selectedColorValue.id
						: parseInt(selectedColorValue.id, 10)
				);
			});
			if (validVariants.length > 0) {
				for (let sizeVal of sizeOption.values) {
					if (
						validVariants.some((v) =>
							v.options.map(String).includes(String(sizeVal.id))
						)
					) {
						setSelectedSize(sizeVal.title);
						return;
					}
				}
			}
		}
	}

	function handleSizeChange(value) {
		setSelectedSize(value);
		setHasChangedSizeOrColor(true);
	}

	return (
		<CustomizeWrapper>
			<Helmet>
				<title>
					{product.printifyProductDetails?.title || product.productName} |
					Customize
				</title>
				<meta
					name='description'
					content={
						product.printifyProductDetails?.description ||
						product.description ||
						"Customize this product with your own designs!"
					}
				/>
				<meta
					name='keywords'
					content={["Print On Demand", "Custom Gift"].join(", ")}
				/>
			</Helmet>

			{/** ------------- ADDED: Our child with props ------------- */}
			<AnimationPODWalkThroughWrapper>
				<AnimationPODWalkThrough
					userAddedText={elements.some(
						(el) =>
							el.type === "text" &&
							el.text.trim() !== "" &&
							el.text !== "Start typing here..."
					)}
					userAddedImage={!!elements.find((el) => el.type === "image")}
					userAddedToCart={didUserAddToCart}
					// Key events
					isSomethingSelected={!!selectedElementId}
					userJustDoubleClickedCanvas={userJustDoubleClickedCanvas}
					userJustSingleClickedText={userJustSingleClickedText}
					// If there are multiple color/size options
					hasMultipleSizeOrColor={hasMultipleSizeOrColor}
					// Called by “Add to Cart” final button
					onUserAddToCart={handleAddToCart}
					// Called by “upload photo” step
					onUserUploadPhoto={() => {
						console.log(
							"PARENT: onUserUploadPhoto function triggered => clicking hidden input"
						);
						hiddenGalleryInputRef.current?.click();
					}}
					// For step 3 (if multiple color/size)
					onHandleColorChange={handleColorChange}
					onHandleSizeChange={handleSizeChange}
					// For the bubble’s color/size <Select>:
					colorOptions={
						product.options
							.find((opt) => opt.name.toLowerCase() === "colors")
							?.values.map((v) => v.title) || []
					}
					sizeOptions={
						product.options
							.find((opt) => opt.name.toLowerCase() === "sizes")
							?.values.map((v) => v.title) || []
					}
					selectedColor={selectedColor}
					selectedSize={selectedSize}
				/>
			</AnimationPODWalkThroughWrapper>

			{/** -------------------------------------------------------- */}

			<Row gutter={[18, 20]}>
				{/* LEFT COLUMN: SLIDER/IMAGES */}
				<Col xs={24} md={12}>
					<StyledSlider {...sliderSettings}>
						{filteredImages.map((image, idx) => {
							if (idx > 0) {
								return (
									<SlideImageWrapper key={image.src}>
										<img src={image.src} alt={`${product.title}-${idx}`} />
									</SlideImageWrapper>
								);
							}
							// First slide => customization
							return (
								<div key={image.src}>
									{isMobile && (
										<MobileToolbarWrapper
											className='noScreenshot'
											style={{
												opacity: showMobileButtons ? 1 : 0,
												transition: "opacity 0.8s ease-in",
											}}
										>
											<MobileLeftCorner>
												{product.options.some(
													(opt) => opt.name.toLowerCase() === "colors"
												) && (
													<Select
														style={{ width: "100%", marginBottom: 8 }}
														placeholder='Color'
														value={selectedColor}
														onChange={handleColorChange}
													>
														{uniqueColorsForDropdown.map((colorTitle) => (
															<Option key={colorTitle} value={colorTitle}>
																{colorTitle}
															</Option>
														))}
													</Select>
												)}

												{product.options.some(
													(opt) => opt.name.toLowerCase() === "sizes"
												) && (
													<Select
														style={{ width: "100%" }}
														placeholder='Size'
														value={selectedSize}
														onChange={handleSizeChange}
													>
														{product.options
															.find((opt) => opt.name.toLowerCase() === "sizes")
															?.values.map((sizeObj) => {
																const isDisabled =
																	!variantExistsForColorSize(sizeObj);
																return (
																	<Option
																		key={sizeObj.title}
																		value={sizeObj.title}
																		disabled={isDisabled}
																		style={{
																			color: isDisabled ? "#aaa" : "inherit",
																		}}
																	>
																		{sizeObj.title}
																	</Option>
																);
															})}
													</Select>
												)}
											</MobileLeftCorner>

											<FloatingActions>
												<Button
													type='primary'
													icon={<ShoppingCartOutlined />}
													onClick={handleAddToCart}
													disabled={isAddToCartDisabled}
													style={{ width: "50%" }}
												>
													{isAddToCartDisabled
														? "Processing..."
														: "Add to Cart"}
												</Button>
												<Button
													icon={<EditOutlined />}
													onClick={() => {
														setMobileTextInput("");
														setTextModalVisible(true);
														try {
															if (
																ReactGA &&
																typeof ReactGA.event === "function"
															) {
																ReactGA.event({
																	category: "User Added Text In Custom Design",
																	action: "User Added Text In Custom Design",
																	label: "User Added Text In Custom Design",
																});
															}
														} catch {}
													}}
												>
													Add Text
												</Button>

												<Button
													icon={<CameraOutlined />}
													onClick={() => hiddenCameraInputRef.current.click()}
												>
													Take Photo
												</Button>
												<input
													type='file'
													accept='image/*'
													capture='environment'
													ref={hiddenCameraInputRef}
													style={{ display: "none" }}
													onChange={(e) => {
														if (e.target.files?.length) {
															addImageElement(e.target.files[0]);
														}
													}}
												/>

												<Button
													icon={<CloudUploadOutlined />}
													onClick={() => {
														try {
															if (
																ReactGA &&
																typeof ReactGA.event === "function"
															) {
																ReactGA.event({
																	category:
																		"User Uploaded Image In Custom Design",
																	action:
																		"User Uploaded Image In Custom Design",
																	label: "User Uploaded Image In Custom Design",
																});
															}
														} catch {}
														hiddenGalleryInputRef.current.click();
													}}
												>
													Upload Image
												</Button>
												<input
													type='file'
													accept='image/*,.jpg,.jpeg,.png,.gif,.webp,.heic,.HEIC,.heif,.HEIF'
													ref={hiddenGalleryInputRef}
													style={{ display: "none" }}
													onChange={(e) => {
														if (e.target.files?.length) {
															addImageElement(e.target.files[0]);
														}
													}}
												/>
											</FloatingActions>
										</MobileToolbarWrapper>
									)}

									<DesignOverlay ref={designOverlayRef}>
										<OverlayImage
											src={image.src}
											alt={`${product.title}-front`}
											crossOrigin='anonymous'
										/>
										<PrintArea
											id='print-area'
											ref={printAreaRef}
											onDoubleClick={handleBlankAreaDoubleClick}
										>
											{showCenterLine && <CenterIndicator />}
											<DottedOverlay className='noScreenshot' />
											{renderDesignElements()}
										</PrintArea>
									</DesignOverlay>
								</div>
							);
						})}
					</StyledSlider>
				</Col>

				{/* RIGHT COLUMN */}
				<Col xs={24} md={12}>
					<ProductTitle level={3}>{product.title}</ProductTitle>
					<ProductDescription>
						{displayedDescription}
						{shouldTruncate && (
							<span>
								{" "}
								<Button
									type='link'
									onClick={() =>
										setIsDescriptionExpanded(!isDescriptionExpanded)
									}
								>
									{isDescriptionExpanded ? "Hide" : "See more"}
								</Button>
							</span>
						)}
					</ProductDescription>

					<div style={{ marginBottom: 16 }}>
						<strong>Price: </strong>
						<span
							style={{
								fontSize: "1.1rem",
								color: "var(--text-color-dark)",
								fontWeight: "bolder",
							}}
						>
							{displayedPrice}
						</span>
					</div>

					<div style={{ marginBottom: 16 }}>
						<strong>Note: </strong>
						<span style={{ fontSize: "1rem", color: "var(--text-color-dark)" }}>
							Please ensure to design within the dotted area.
							<br />
							If your design extends slightly beyond the dotted border, it may
							be cropped.
						</span>
					</div>

					<CustomizePanel className='whole-select-options'>
						<Title
							level={4}
							style={{ color: "var(--text-color-dark)", marginBottom: 8 }}
						>
							Select Options:
						</Title>
						<Row gutter={12}>
							{product.options.some(
								(opt) => opt.name.toLowerCase() === "colors"
							) && (
								<Col span={12}>
									<Select
										style={{ width: "100%" }}
										className='selectDesktopOrMobile'
										placeholder='Color'
										value={selectedColor}
										onChange={handleColorChange}
									>
										{uniqueColorsForDropdown.map((colorTitle) => (
											<Option key={colorTitle} value={colorTitle}>
												{colorTitle}
											</Option>
										))}
									</Select>
								</Col>
							)}

							{product.options.some(
								(opt) => opt.name.toLowerCase() === "sizes"
							) && (
								<Col span={12}>
									<Select
										style={{ width: "100%" }}
										className='selectDesktopOrMobile'
										placeholder='Size'
										value={selectedSize}
										onChange={handleSizeChange}
									>
										{product.options
											.find((opt) => opt.name.toLowerCase() === "sizes")
											?.values.map((sizeObj) => {
												const isDisabled = !variantExistsForColorSize(sizeObj);
												return (
													<Option
														key={sizeObj.title}
														value={sizeObj.title}
														disabled={isDisabled}
														style={{ color: isDisabled ? "#aaa" : "inherit" }}
													>
														{sizeObj.title}
													</Option>
												);
											})}
									</Select>
								</Col>
							)}
						</Row>
						<Divider style={{ margin: "16px 0" }} />

						<Title level={4} style={{ color: "var(--text-color-dark)" }}>
							Add/Update Text
						</Title>
						{!isMobile && (
							<>
								<Row gutter={8}>
									<Col span={24}>
										<Input.TextArea
											placeholder='Enter text here'
											value={userText}
											onChange={(e) => setUserText(e.target.value)}
											autoSize={{ minRows: 2, maxRows: 6 }}
										/>
									</Col>
								</Row>
								<div style={{ marginTop: 12 }}>
									<Button
										type='primary'
										block
										onClick={() => addTextElement(null, true)}
										style={{ fontWeight: "bold" }}
									>
										Add Text
									</Button>
								</div>
							</>
						)}

						<Divider />
						<Title level={4}>Upload Your Image</Title>

						{!isMobile && (
							<UploadZone {...getRootProps()}>
								<input {...getInputProps()} />
								<p>Drag &amp; drop or click to select an image</p>
							</UploadZone>
						)}
					</CustomizePanel>

					{!isMobile && (
						<div
							style={{ width: "50%", fontSize: "1.1rem", fontWeight: "bold" }}
						>
							<button
								type='primary'
								onClick={handleAddToCart}
								disabled={isAddToCartDisabled}
								className='btn btn-success'
								style={{
									width: "50%",
									fontSize: "1.2rem",
									fontWeight: "bold",
								}}
							>
								{isAddToCartDisabled ? "Processing..." : "Add to Cart"}
							</button>
						</div>
					)}
				</Col>
			</Row>

			{/* MOBILE BOTTOM PANEL */}
			{isMobile && (
				<MobileBottomPanel>
					<Divider />
					<CustomizePanel>
						<Title
							level={4}
							style={{ color: "var(--text-color-dark)", marginBottom: 8 }}
						>
							Select Options:
						</Title>
						<Row gutter={12}>
							{product.options.some(
								(opt) => opt.name.toLowerCase() === "colors"
							) && (
								<Col span={12}>
									<Select
										style={{ width: "100%" }}
										placeholder='Color'
										value={selectedColor}
										onChange={handleColorChange}
									>
										{uniqueColorsForDropdown.map((colorTitle) => (
											<Option key={colorTitle} value={colorTitle}>
												{colorTitle}
											</Option>
										))}
									</Select>
								</Col>
							)}

							{product.options.some(
								(opt) => opt.name.toLowerCase() === "sizes"
							) && (
								<Col span={12}>
									<Select
										style={{ width: "100%" }}
										placeholder='Size'
										value={selectedSize}
										onChange={handleSizeChange}
									>
										{product.options
											.find((opt) => opt.name.toLowerCase() === "sizes")
											?.values.map((sizeObj) => {
												const isDisabled = !variantExistsForColorSize(sizeObj);
												return (
													<Option
														key={sizeObj.title}
														value={sizeObj.title}
														disabled={isDisabled}
														style={{ color: isDisabled ? "#aaa" : "inherit" }}
													>
														{sizeObj.title}
													</Option>
												);
											})}
									</Select>
								</Col>
							)}
						</Row>
						<Divider style={{ margin: "16px 0" }} />

						<Title level={4} style={{ color: "var(--text-color-dark)" }}>
							Add/Update Text
						</Title>
						<Row gutter={8}>
							<Col span={24}>
								<Input.TextArea
									placeholder='Enter text here'
									value={userText}
									onChange={(e) => setUserText(e.target.value)}
									autoSize={{ minRows: 2, maxRows: 6 }}
								/>
							</Col>
						</Row>
						<div style={{ marginTop: 12 }}>
							<Button
								type='primary'
								block
								onClick={() => addTextElement(null, true)}
								style={{ fontWeight: "bold" }}
							>
								Add Text
							</Button>
						</div>

						<Divider />
						<Title level={4}>Upload Your Image</Title>

						<UploadZone {...getRootProps()}>
							<input {...getInputProps()} />
							<p>Drag &amp; drop or tap to select an image</p>
						</UploadZone>

						<Divider />
						<Button
							type='primary'
							icon={<ShoppingCartOutlined />}
							onClick={handleAddToCart}
							disabled={isAddToCartDisabled}
							style={{ width: "100%", marginTop: "1rem" }}
						>
							{isAddToCartDisabled ? "Processing..." : "Add to Cart"}
						</Button>
					</CustomizePanel>
				</MobileBottomPanel>
			)}

			{/* MOBILE TEXT MODAL */}
			<Modal
				title='Add Your Text'
				open={textModalVisible}
				onCancel={() => setTextModalVisible(false)}
				onOk={() => {
					addTextElement(mobileTextInput, true);
					setTextModalVisible(false);
				}}
			>
				<Input
					placeholder='Type your text here...'
					value={mobileTextInput}
					onChange={(e) => setMobileTextInput(e.target.value)}
				/>
			</Modal>

			{uploadingImage && (
				<UploadOverlay>
					<Spin size='large' tip='Uploading image...' />
				</UploadOverlay>
			)}

			{/* BARE DESIGN (for screenshot) */}
			<BareDesignOverlay ref={bareDesignRef}>
				<BarePrintArea id='bare-print-area' ref={barePrintAreaRef}>
					{elements.map((el) => (
						<Rnd
							key={el.id}
							bounds='#bare-print-area'
							position={{ x: el.x, y: el.y }}
							size={{ width: el.width, height: el.height }}
							onDragStop={(e, data) => handleRndDragStop(e, data, el.id)}
							onResizeStop={(e, dir, ref, delta, pos) =>
								handleRndResizeStop(e, dir, ref, delta, pos, el.id)
							}
							cancel='.text-toolbar, .image-toolbar, .text-toolbar *, .image-toolbar *'
							style={{
								position: "absolute",
							}}
						>
							<div
								style={{
									width: "100%",
									height: "100%",
									transform: `rotate(${el.rotation || 0}deg)`,
									transformOrigin: "center center",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								{el.type === "text" ? (
									<div
										style={{
											whiteSpace: "pre-wrap",
											color: el.color,
											backgroundColor: el.backgroundColor,
											fontSize: el.fontSize,
											fontFamily: el.fontFamily,
											fontWeight: el.fontWeight,
											fontStyle: el.fontStyle,
											borderRadius: el.borderRadius,
											width: "100%",
											height: "100%",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											textAlign: "center",
										}}
									>
										{el.text}
									</div>
								) : (
									<img
										src={el.src}
										alt='Custom'
										style={{
											width: "100%",
											height: "100%",
											objectFit: "contain",
											borderRadius: el.borderRadius || 0,
										}}
									/>
								)}
							</div>
						</Rnd>
					))}
				</BarePrintArea>
			</BareDesignOverlay>

			<PrintifyCheckoutModal
				open={isCheckoutModalVisible}
				onClose={() => setIsCheckoutModalVisible(false)}
				order={order}
				setOrder={setOrder}
				product={product}
			/>
		</CustomizeWrapper>
	);

	function renderDesignElements() {
		return elements.map((el) => {
			const isSelected = el.id === selectedElementId;
			return (
				<Rnd
					key={el.id}
					className='rnd-element'
					bounds='#print-area'
					position={{ x: el.x, y: el.y }}
					size={{ width: el.width, height: el.height }}
					enableResizing={{
						topLeft: true,
						topRight: true,
						bottomLeft: true,
						bottomRight: true,
					}}
					handleStyles={{
						topLeft: { width: "20px", height: "20px" },
						topRight: { width: "20px", height: "20px" },
						bottomLeft: { width: "20px", height: "20px" },
						bottomRight: { width: "20px", height: "20px" },
					}}
					onDrag={(e, data) => handleRndDrag(e, data, el.id)}
					onDragStop={(e, data) => handleRndDragStop(e, data, el.id)}
					onResizeStart={() => setSelectedElementId(el.id)}
					onResizeStop={(e, dir, ref, delta, pos) =>
						handleRndResizeStop(e, dir, ref, delta, pos, el.id)
					}
					dragHandleClassName={DRAGGABLE_REGION_CLASS}
					cancel='.rotate-handle, .text-toolbar, .image-toolbar, .text-toolbar *, .image-toolbar *'
					style={{
						border: isSelected
							? "1px dashed var(--text-color-dark)"
							: "1px dashed transparent",
						position: "absolute",
					}}
					onMouseDown={() => handleElementClick(el)}
					onTouchStart={() => handleElementClick(el)}
				>
					<div
						className={DRAGGABLE_REGION_CLASS}
						style={{
							width: "100%",
							height: "100%",
							cursor: "move",
							transform: `rotate(${el.rotation || 0}deg)`,
							transformOrigin: "center center",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{el.type === "text" ? (
							inlineEditId === el.id ? (
								<InlineEditContainer>
									<Input.TextArea
										value={inlineEditText}
										onChange={(e) => setInlineEditText(e.target.value)}
										autoFocus
										onBlur={() => handleInlineEditSave(el.id)}
										autoSize={{ minRows: 2, maxRows: 6 }}
									/>
									<InlineEditButtons>
										<Button
											type='primary'
											size='small'
											onMouseDown={(e) => e.preventDefault()}
											onClick={() => handleInlineEditSave(el.id)}
											style={{ marginRight: 8 }}
										>
											Save
										</Button>
										<Button
											size='small'
											onMouseDown={(e) => e.preventDefault()}
											onClick={() => setInlineEditId(null)}
										>
											Cancel
										</Button>
									</InlineEditButtons>
								</InlineEditContainer>
							) : (
								<TextElement
									onDoubleClick={() => handleTextDoubleClick(el)}
									onTouchEnd={() => handleTextTouchEnd(el)}
									style={{
										whiteSpace: "pre-wrap",
										color: el.color,
										backgroundColor: el.backgroundColor,
										fontSize: el.fontSize,
										fontFamily: el.fontFamily,
										fontWeight: el.fontWeight,
										fontStyle: el.fontStyle,
										borderRadius: el.borderRadius,
										width: "100%",
										height: "100%",
										padding: "4px",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										textAlign: "center",
										userSelect: "none",
									}}
								>
									{el.text}
								</TextElement>
							)
						) : (
							<ImageElement
								src={el.src}
								alt='Custom'
								style={{
									width: "100%",
									height: "100%",
									objectFit: "contain",
									borderRadius: el.borderRadius || 0,
									userSelect: "none",
								}}
							/>
						)}
					</div>

					{isSelected && (
						<RotateHandle
							className='rotate-handle'
							onMouseDown={(evt) => onRotationStart(evt, el.id)}
							onTouchStart={(evt) => onRotationStart(evt, el.id)}
							title='Rotate this element'
							style={{ touchAction: "none" }}
						>
							↻
						</RotateHandle>
					)}

					{isSelected &&
						el.type === "text" &&
						showTooltipForText === el.id &&
						!isRotating && (
							<DoubleClickTooltip>
								{isMobile
									? "Double-tap to edit text"
									: "Double-click to edit text"}
							</DoubleClickTooltip>
						)}

					{isSelected && el.type === "text" && !isRotating && (
						<TextToolbarContainer className='text-toolbar'>
							<TextToolbar>
								<ToolbarRowOne>
									<Button
										size='small'
										icon={<DownOutlined />}
										onClick={() => {
											const newSize = Math.max(el.fontSize - 1, 8);
											setElements((prev) =>
												prev.map((item) =>
													item.id === el.id
														? { ...item, fontSize: newSize }
														: item
												)
											);
										}}
									/>
									<span
										style={{
											fontWeight: "bold",
											background: "black",
											padding: "2px",
											borderRadius: "10px",
											color: "lightgrey",
										}}
									>
										{el.fontSize}
									</span>
									<Button
										size='small'
										icon={<UpOutlined />}
										onClick={() => {
											const newSize = Math.min(el.fontSize + 1, 72);
											setElements((prev) =>
												prev.map((item) =>
													item.id === el.id
														? { ...item, fontSize: newSize }
														: item
												)
											);
										}}
									/>
									<Popover
										content={
											<>
												<span
													style={{ fontSize: "0.75rem", fontWeight: "bold" }}
												>
													Click to choose color
												</span>
												<Input
													type='color'
													defaultValue={el.color || "#000000"}
													onChange={(ev) => {
														const newColor = ev.target.value;
														setElements((prev) =>
															prev.map((item) =>
																item.id === el.id
																	? { ...item, color: newColor }
																	: item
															)
														);
														setTextColor(newColor);
													}}
												/>
											</>
										}
										trigger='click'
										placement='top'
									>
										<FontColorsOutlined
											style={{ cursor: "pointer", color: el.color }}
											title='Change Font Color'
										/>
									</Popover>
									<Popover
										content={
											<>
												<span
													style={{ fontSize: "0.75rem", fontWeight: "bold" }}
												>
													Click to choose color
												</span>
												<Input
													type='color'
													defaultValue={el.backgroundColor || "transparent"}
													onChange={(ev) => {
														const newBg = ev.target.value;
														setElements((prev) =>
															prev.map((item) =>
																item.id === el.id
																	? { ...item, backgroundColor: newBg }
																	: item
															)
														);
													}}
												/>
											</>
										}
										trigger='click'
										placement='top'
									>
										<BgColorsOutlined
											style={{ cursor: "pointer" }}
											title='BG Color'
										/>
									</Popover>
									<FontFamilySelect
										value={el.fontFamily}
										onChange={(value) => {
											setElements((prev) =>
												prev.map((item) =>
													item.id === el.id
														? { ...item, fontFamily: value }
														: item
												)
											);
										}}
										placeholder='Font'
										allowClear
									>
										<Option value='Arial' style={{ fontFamily: "Arial" }}>
											Arial
										</Option>
										<Option
											value='Times New Roman'
											style={{ fontFamily: "Times New Roman" }}
										>
											Times New Roman
										</Option>
										<Option value='Courier' style={{ fontFamily: "Courier" }}>
											Courier
										</Option>
										<Option value='Georgia' style={{ fontFamily: "Georgia" }}>
											Georgia
										</Option>
										<Option value='Verdana' style={{ fontFamily: "Verdana" }}>
											Verdana
										</Option>
										<Option value='Allura' style={{ fontFamily: "Allura" }}>
											Allura
										</Option>
										<Option
											value='Dancing Script'
											style={{ fontFamily: "Dancing Script" }}
										>
											Dancing Script
										</Option>
										<Option
											value='Great Vibes'
											style={{ fontFamily: "Great Vibes" }}
										>
											Great Vibes
										</Option>
										<Option value='Lobster' style={{ fontFamily: "Lobster" }}>
											Lobster
										</Option>
									</FontFamilySelect>
								</ToolbarRowOne>

								<ToolbarRowTwo>
									<BoldOutlined
										onClick={() => {
											const newWeight =
												el.fontWeight === "bold" ? "normal" : "bold";
											setElements((prev) =>
												prev.map((item) =>
													item.id === el.id
														? { ...item, fontWeight: newWeight }
														: item
												)
											);
											setFontWeight(newWeight);
										}}
									/>
									<ItalicOutlined
										onClick={() =>
											setElements((prev) =>
												prev.map((item) =>
													item.id === el.id
														? {
																...item,
																fontStyle:
																	item.fontStyle === "italic"
																		? "normal"
																		: "italic",
															}
														: item
												)
											)
										}
										style={{
											fontStyle:
												el.fontStyle === "italic" ? "italic" : "normal",
											fontWeight: "bold",
										}}
										title='Toggle Italic'
									/>
									<InputNumber
										min={0}
										max={50}
										value={el.borderRadius}
										onChange={(value) =>
											setElements((prev) =>
												prev.map((item) =>
													item.id === el.id
														? { ...item, borderRadius: value }
														: item
												)
											)
										}
										size='small'
										style={{ width: 60 }}
										placeholder='Radius'
										title='Border Radius'
									/>
									<NoBgSpan
										onClick={() => {
											setElements((prev) =>
												prev.map((item) =>
													item.id === el.id
														? { ...item, backgroundColor: "transparent" }
														: item
												)
											);
										}}
									>
										NoBackground
									</NoBgSpan>
									<DeleteIcon
										onClick={() => deleteSelectedElement(el.id)}
										title='Delete'
									>
										<DeleteOutlined />
									</DeleteIcon>
								</ToolbarRowTwo>
								<ToolbarRowReset>
									<ResetIcon
										onClick={() => handleResetStyling(el.id)}
										title='Reset styling'
									>
										<ReloadOutlined />
									</ResetIcon>
								</ToolbarRowReset>
							</TextToolbar>
						</TextToolbarContainer>
					)}

					{isSelected && el.type === "image" && !isRotating && (
						<ImageToolbarContainer className='image-toolbar'>
							<ImageToolbar>
								<ToolbarRowImage>
									<InputNumber
										min={0}
										max={200}
										value={el.borderRadius || 0}
										onChange={(value) => {
											setElements((prev) =>
												prev.map((item) =>
													item.id === el.id
														? { ...item, borderRadius: value }
														: item
												)
											);
											setBorderRadius(value);
										}}
										size='small'
										style={{ width: 80 }}
										placeholder='Radius'
										title='Border Radius'
									/>
									<RemoveBgButton onClick={() => handleRemoveBgToggle(el.id)}>
										{el.bgRemoved ? "Default" : "Remove BG"}
									</RemoveBgButton>
									<DeleteIcon
										onClick={() => deleteSelectedElement(el.id)}
										title='Delete Image'
									>
										<DeleteOutlined />
									</DeleteIcon>
								</ToolbarRowImage>
								<ToolbarRowReset>
									<ResetIcon
										onClick={() => handleResetStyling(el.id)}
										title='Reset styling'
									>
										<ReloadOutlined />
									</ResetIcon>
								</ToolbarRowReset>
							</ImageToolbar>
						</ImageToolbarContainer>
					)}
				</Rnd>
			);
		});
	}
}

/**
 * ------------------------------------------------------------------------
 * D) STYLED COMPONENTS
 * ------------------------------------------------------------------------
 */
const CustomizeWrapper = styled.section`
	padding: 40px;
	min-height: 85vh;
	background-color: var(--background-light);

	@media (max-width: 800px) {
		padding: 10px !important;
		margin: 0 !important;
	}
`;

const StyledSlider = styled(Slider)`
	.slick-slide {
		text-align: center;
		outline: none;
	}
	.slick-dots {
		bottom: -30px;
	}
`;

const DesignOverlay = styled.div`
	position: relative;
	margin: 0 auto;
	width: 90%;
	max-width: 800px;
	height: 700px;
	background-color: #ffffff;
	overflow: hidden;

	@media (max-width: 800px) {
		width: 100%;
		max-width: 100%;
		height: auto;
		overflow: visible;
		aspect-ratio: 800 / 700;
	}
`;

const PrintArea = styled.div`
	position: absolute;
	top: 20%;
	left: 20%;
	width: 60%;
	height: 75%;
	pointer-events: auto;
	z-index: 1;
`;

const DottedOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border: 2px dashed rgba(0, 0, 0, 0.2);
	pointer-events: none;
	z-index: 2;
`;

const OverlayImage = styled.img`
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
	position: absolute;
	top: 0;
	left: 0;
	z-index: 0;
	crossorigin: "anonymous";
`;

const SlideImageWrapper = styled.div`
	display: flex !important;
	align-items: center;
	justify-content: center;
	min-height: 610px;
	background-color: #ffffff;
	cursor: pointer;

	img {
		width: 80%;
		height: auto;
		max-width: 500px;
	}

	@media (max-width: 800px) {
		min-height: auto !important;
		padding-bottom: 0 !important;
	}
`;

const MobileToolbarWrapper = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
	padding: 8px;
	background: #fff;
`;

const MobileLeftCorner = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
`;

const FloatingActions = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;

	button {
		display: flex;
		align-items: center;
		gap: 6px;
	}
`;

const MobileBottomPanel = styled.div`
	margin-top: 2rem;
`;

const TextElement = styled.div`
	z-index: 2 !important;
`;
const ImageElement = styled.img``;

const TextToolbarContainer = styled.div`
	position: absolute;
	top: -150px;
	left: 0;
	z-index: 9999;

	@media (max-width: 700px) {
		top: -160px;
	}
`;

const TextToolbar = styled.div`
	display: flex;
	flex-direction: column;
	background: rgba(255, 255, 255, 0.9);
	border: 1px solid var(--border-color-light);
	border-radius: 4px;
	padding: 4px 8px;
	gap: 6px;
`;

const ToolbarRowOne = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 4px;
`;

const ToolbarRowTwo = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 4px;
`;

const ToolbarRowReset = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 8px;
`;

const ResetIcon = styled.div`
	background: #f0f0f0;
	color: #666;
	border-radius: 4px;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	border: 1px solid #ccc;
`;

const DeleteIcon = styled.div`
	background: #ff4d4f;
	color: #fff;
	border-radius: 50%;
	width: 20px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
`;

const NoBgSpan = styled.span`
	font-size: 0.75rem;
	cursor: pointer;
	padding: 4px 6px;
	text-decoration: underline;
	font-weight: bold;
`;

const FontFamilySelect = styled(Select)`
	width: 130px;
	margin-left: 0 !important;

	.ant-select-selector {
		display: flex;
		align-items: center;
		height: 32px !important;
	}
`;

const CustomizePanel = styled.div`
	background: #fff;
	padding: 16px;
	margin-bottom: 16px;
	border-radius: 8px;
	box-shadow: var(--box-shadow-light);
`;

const UploadZone = styled.div`
	width: 100%;
	padding: 16px;
	border: 2px dashed var(--border-color-dark, #707070);
	border-radius: 8px;
	text-align: center;
	cursor: pointer;
	background-color: var(--neutral-light, #f7f4ef);

	&:hover {
		background-color: var(--neutral-light2, #e2e6f0);
	}
`;

const ProductTitle = styled(Title)`
	&& {
		margin-bottom: 8px;
		font-weight: 600;
		color: var(--text-color-dark);
	}
`;

const ProductDescription = styled.p`
	margin-bottom: 16px;
	color: var(--text-color-secondary);
	line-height: 1.4;
`;

const InlineEditContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const InlineEditButtons = styled.div`
	display: flex;
	gap: 8px;
`;

const BareDesignOverlay = styled.div`
	position: absolute;
	top: -9999px;
	left: -9999px;
	width: 90%;
	max-width: 800px;
	height: 700px;
	background: transparent;
	overflow: visible;
`;

const BarePrintArea = styled.div`
	position: absolute;
	top: 20%;
	left: 25%;
	width: 50%;
	height: 40%;
	pointer-events: auto;
`;

const RotateHandle = styled.div`
	position: absolute;
	top: 50%;
	right: -25px;
	transform: translateY(-50%);
	cursor: grab;
	font-size: 16px;
	background: #fff;
	border: 1px solid #999;
	border-radius: 50%;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
	user-select: none;

	&:active {
		cursor: grabbing;
	}
`;

const ImageToolbarContainer = styled.div`
	position: absolute;
	top: -90px;
	left: 0;
	z-index: 9999;

	@media (max-width: 700px) {
		top: -100px;
	}
`;

const ImageToolbar = styled.div`
	display: flex;
	flex-direction: column;
	background: rgba(255, 255, 255, 0.9);
	border: 1px solid var(--border-color-light);
	border-radius: 4px;
	padding: 4px 8px;
	gap: 6px;
`;

const ToolbarRowImage = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

const RemoveBgButton = styled(Button)`
	background: #ffc069;
	border-color: #ffc069;
	color: #000;
	&:hover {
		background: #ffd591;
		border-color: #ffd591;
	}
`;

const DoubleClickTooltip = styled.div`
	position: absolute;
	top: calc(100%);
	left: 50%;
	transform: translateX(-50%) translateY(10px);
	background: #222;
	color: #fff;
	padding: 6px 10px;
	border-radius: 4px;
	font-size: 0.75rem;
	pointer-events: none;
	white-space: nowrap;
	z-index: 999999;
	opacity: 0;
	animation: tooltipFadeInOut 5s forwards;

	@keyframes tooltipFadeInOut {
		0% {
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		90% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
`;

const CenterIndicator = styled.div`
	position: absolute;
	top: 0;
	bottom: 0;
	width: 2px;
	left: 50%;
	pointer-events: none;
	z-index: 9999;
	border: 1px dotted rgba(255, 0, 0, 0.3);
`;

const UploadOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(128, 128, 128, 0.5);
	z-index: 9999999;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const AnimationPODWalkThroughWrapper = styled.div`
	position: absolute;
	top: 50%;
	left: -80px;
	z-index: 1; /* ensure it's on top */

	@media (max-width: 700px) {
		left: -220px;
		top: 40%;

		.addCartWrapper {
			bottom: 20px !important;
			button {
				position: absolute;
				left: 180px;
				top: -90px;
				width: 200px !important;
			}
		}
	}
`;
