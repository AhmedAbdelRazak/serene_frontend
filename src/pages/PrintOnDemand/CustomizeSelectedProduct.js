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
import ReactPixel from "react-facebook-pixel";

// heic2any for .heic → jpeg
import heic2any from "heic2any";

// Fallback library for final image conversion
import domtoimage from "dom-to-image-more";

// Child tutorial/animation
import AnimationPODWalkThrough from "../MyAnimationComponents/AnimationPODWalkThrough";

const { Title } = Typography;
const { Option } = Select;

/**
 * ------------------------------------------------------------------------
 * PERMISSION HELPER (camera fallback)
 * ------------------------------------------------------------------------
 */
async function requestImagePermissions() {
	try {
		if (navigator?.mediaDevices?.getUserMedia) {
			await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment" },
				audio: false,
			});
			console.log("Camera permission requested as fallback…");
		}
	} catch (err) {
		console.warn("User denied camera permission or device not supported:", err);
	}
}

/**
 * ------------------------------------------------------------------------
 * HELPER FUNCTIONS
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
 * Crop a canvas to remove fully-transparent edges
 */
function cropCanvasToTransparentBounds(originalCanvas) {
	const ctx = originalCanvas.getContext("2d", { willReadFrequently: true });
	const { width, height } = originalCanvas;
	const imageData = ctx.getImageData(0, 0, width, height).data;

	let top = 0,
		bottom = height,
		left = 0,
		right = width;

	topLoop: for (; top < height; top++) {
		for (let x = 0; x < width; x++) {
			const idx = (top * width + x) * 4 + 3;
			if (imageData[idx] !== 0) break topLoop;
		}
	}
	bottomLoop: for (; bottom > top; bottom--) {
		for (let x = 0; x < width; x++) {
			const idx = ((bottom - 1) * width + x) * 4 + 3;
			if (imageData[idx] !== 0) break bottomLoop;
		}
	}
	leftLoop: for (; left < width; left++) {
		for (let y = top; y < bottom; y++) {
			const idx = (y * width + left) * 4 + 3;
			if (imageData[idx] !== 0) break leftLoop;
		}
	}
	rightLoop: for (; right > left; right--) {
		for (let y = top; y < bottom; y++) {
			const idx = (y * width + right - 1) * 4 + 3;
			if (imageData[idx] !== 0) break rightLoop;
		}
	}

	const croppedWidth = right - left;
	const croppedHeight = bottom - top;
	if (croppedWidth <= 0 || croppedHeight <= 0) {
		// everything is transparent => return original
		return originalCanvas;
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

function compressCanvas(canvas, { mimeType = "image/png", quality = 1 } = {}) {
	// Force PNG to guarantee alpha channel
	const targetMime = "image/png";

	return new Promise((resolve, reject) => {
		/* Modern browsers – use toBlob (asynchronous, avoids memory bloat) */
		if (canvas.toBlob) {
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						return reject(new Error("Canvas is empty or toBlob() failed."));
					}
					const reader = new FileReader();
					reader.onload = () => resolve(reader.result); // data‑URL string
					reader.onerror = (err) => reject(err);
					reader.readAsDataURL(blob);
				},
				targetMime,
				quality // ignored for PNG but harmless
			);
			return;
		}

		/* Fallback – toDataURL then convert to Blob for parity */
		try {
			const dataURL = canvas.toDataURL(targetMime, quality);
			const blob = dataURLtoBlob(dataURL); // ← you already have this helper
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);
			reader.onerror = (err) => reject(err);
			reader.readAsDataURL(blob);
		} catch (err) {
			reject(err);
		}
	});
}

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
		file.name?.toLowerCase().endsWith(".mov")
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
						if (!blob) return reject(new Error("Canvas toBlob returned null"));
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
 * ------------------------------------------------------------------------
 * The main component
 * ------------------------------------------------------------------------
 */
export default function CustomizeSelectedProduct() {
	const { productId } = useParams();
	const [product, setProduct] = useState(null);
	const [loading, setLoading] = useState(true);

	const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

	// selected color, size, scent
	const [selectedColor, setSelectedColor] = useState("");
	const [selectedSize, setSelectedSize] = useState("");
	const [selectedScent, setSelectedScent] = useState("");

	// Current text styling
	const [userText, setUserText] = useState("");
	const [textColor, setTextColor] = useState("#000000");
	const [fontFamily, setFontFamily] = useState("Arial");
	const [fontSize, setFontSize] = useState(24);
	const [fontWeight, setFontWeight] = useState("normal");
	const [fontStyle, setFontStyle] = useState("normal");
	const [borderRadius, setBorderRadius] = useState(0);

	// All design elements (text or images)
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
		localStorage.setItem("customGiftModalDismissed", "true");
		localStorage.setItem("customGiftModalDismissed2", "Yes");
		const handleResize = () => setIsMobile(window.innerWidth < 800);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const { addToCart, openSidebar2 } = useCartContext();
	const { user, token } = isAuthenticated();

	// fallback user ID / token
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
					ReactPixel.track("CustomizeProduct", {
						content_name: product?.title || product?.productName,
						content_ids: [product?._id],
						content_type: "product",
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

	// Additional states to track user actions
	const [didUserAddToCart, setDidUserAddToCart] = useState(false);
	const [hasChangedSizeOrColor, setHasChangedSizeOrColor] = useState(false);
	const [userJustDoubleClickedCanvas, setUserJustDoubleClickedCanvas] =
		useState(false);
	const [hasMultipleSizeOrColor, setHasMultipleSizeOrColor] = useState(false);

	/**
	 * ----------------------------------------------------------------
	 * 1) LOAD PRODUCT
	 * ----------------------------------------------------------------
	 */
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
				const fetchedProduct = {
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

				// only keep variants with a numeric price
				const validVariants = fetchedProduct.variants.filter(
					(variant) => typeof variant.price === "number" && variant.price > 0
				);
				if (!validVariants.length) {
					message.error("No valid variants with pricing were found.");
					setLoading(false);
					return;
				}
				fetchedProduct.variants = validVariants;

				// filter out option values that have no matching variant
				fetchedProduct.options = fetchedProduct.options.map((opt) => {
					const newValues = opt.values.filter((val) =>
						validVariants.some((v) => v.options.includes(val.id))
					);
					return { ...opt, values: newValues };
				});

				setProduct(fetchedProduct);

				// FB pixel track
				ReactPixel.track("CustomizeProduct", {
					content_name: fetchedProduct.title || fetchedProduct.productName,
					content_ids: [fetchedProduct._id],
					content_type: "product",
				});

				// Check query params for color/size/scent
				const queryParams = new URLSearchParams(window.location.search);
				const colorParam = queryParams.get("color");
				const sizeParam = queryParams.get("size");
				const scentParam = queryParams.get("scent");

				const colorOpt = fetchedProduct.options.find(
					(o) => o.name.toLowerCase() === "colors"
				);
				const sizeOpt = fetchedProduct.options.find(
					(o) => o.name.toLowerCase() === "sizes"
				);
				const scentOpt = fetchedProduct.options.find(
					(o) => o.name.toLowerCase() === "scents"
				);

				// color
				if (colorOpt?.values?.length) {
					if (
						colorParam &&
						colorOpt.values.some((val) => val.title === colorParam)
					) {
						setSelectedColor(colorParam);
					} else {
						setSelectedColor(colorOpt.values[0].title);
					}
				} else {
					setSelectedColor("");
				}

				// size - existing approach
				let chosenSize = "";
				if (sizeOpt?.values?.length) {
					if (
						sizeParam &&
						sizeOpt.values.some((val) => val.title === sizeParam)
					) {
						chosenSize = sizeParam;
					} else {
						// check if there's an is_default variant
						const defVar = validVariants.find((v) => v.is_default);
						if (defVar) {
							const defSizeVal = sizeOpt.values.find((sv) =>
								defVar.options.includes(sv.id)
							);
							if (defSizeVal) {
								chosenSize = defSizeVal.title;
							} else {
								chosenSize = sizeOpt.values[0].title;
							}
						} else {
							chosenSize = sizeOpt.values[0].title;
						}
					}
				}

				// If STILL no chosenSize => fallback to productAttributes
				if (!chosenSize && fetchedProduct.productAttributes?.length) {
					const foundAttrWithSize = fetchedProduct.productAttributes.find(
						(attr) => attr.size && attr.size.trim() !== ""
					);
					if (foundAttrWithSize) {
						chosenSize = foundAttrWithSize.size;
					}
				}
				setSelectedSize(chosenSize || "");

				// scent
				let chosenScent = "";
				if (scentOpt?.values?.length) {
					if (
						scentParam &&
						scentOpt.values.some((val) => val.title === scentParam)
					) {
						chosenScent = scentParam;
					} else {
						chosenScent = scentOpt.values[0].title;
					}
				}
				// fallback: check productAttributes if needed
				if (!chosenScent && fetchedProduct.productAttributes?.length) {
					const foundAttrWithScent = fetchedProduct.productAttributes.find(
						(attr) => attr.scent && attr.scent.trim() !== ""
					);
					if (foundAttrWithScent) {
						chosenScent = foundAttrWithScent.scent;
					}
				}
				setSelectedScent(chosenScent || "");

				setLoading(false);
			} catch (err) {
				console.error(err);
				message.error("Failed to load product details.");
				setLoading(false);
			}
		};
		fetchProduct();
	}, [productId]);

	/**
	 * Check if multiple color/size/scent
	 */
	useEffect(() => {
		if (!product) return;
		const colorOpt = product.options.find(
			(o) => o.name.toLowerCase() === "colors"
		);
		const sizeOpt = product.options.find(
			(o) => o.name.toLowerCase() === "sizes"
		);
		const scentOpt = product.options.find(
			(o) => o.name.toLowerCase() === "scents"
		);

		const multipleColors = colorOpt?.values?.length > 1;
		const multipleSizes = sizeOpt?.values?.length > 1;
		const multipleScents = scentOpt?.values?.length > 1;

		if (multipleColors || multipleSizes || multipleScents) {
			setHasMultipleSizeOrColor(true);
		} else {
			setHasMultipleSizeOrColor(false);
		}
	}, [product]);

	/**
	 * 2) Add a default text box in the middle
	 */
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

	/**
	 * 3) Whenever color/size/scent changes => update variant_id
	 */
	useEffect(() => {
		if (!product) return;
		function numOrStr(x) {
			return typeof x === "number" ? x : parseInt(x, 10);
		}

		const colorOpt = product.options.find(
			(o) => o.name.toLowerCase() === "colors"
		);
		const sizeOpt = product.options.find(
			(o) => o.name.toLowerCase() === "sizes"
		);
		const scentOpt = product.options.find(
			(o) => o.name.toLowerCase() === "scents"
		);

		let matchingVariant = null;
		// gather chosen IDs
		const chosenIds = [];
		if (colorOpt && selectedColor) {
			const cVal = colorOpt.values.find((v) => v.title === selectedColor);
			if (cVal) chosenIds.push(numOrStr(cVal.id));
		}
		if (sizeOpt && selectedSize) {
			const sVal = sizeOpt.values.find((v) => v.title === selectedSize);
			if (sVal) chosenIds.push(numOrStr(sVal.id));
		}
		if (scentOpt && selectedScent) {
			const scVal = scentOpt.values.find((v) => v.title === selectedScent);
			if (scVal) chosenIds.push(numOrStr(scVal.id));
		}

		matchingVariant = product.variants.find((v) => {
			const varIds = v.options.map(numOrStr);
			return chosenIds.every((ch) => varIds.includes(ch));
		});

		setOrder((prev) => ({ ...prev, variant_id: matchingVariant?.id || null }));
	}, [product, selectedColor, selectedSize, selectedScent]);

	// If user changes color/size/scent => setHasChanged
	useEffect(() => {
		if (
			!hasChangedSizeOrColor &&
			(selectedColor || selectedSize || selectedScent)
		) {
			setHasChangedSizeOrColor(true);
		}
	}, [selectedColor, selectedSize, selectedScent, hasChangedSizeOrColor]);

	/**
	 * 3a) HELPER to see if a given color combination is valid =>
	 * (We usually won't disable color the same way we do size, but if you need it, here's a sample.)
	 */
	function variantExistsForColor(colorTitle, chosenSize, chosenScent) {
		if (!product) return false;

		const colorOpt = product.options.find(
			(o) => o.name.toLowerCase() === "colors"
		);
		const sizeOpt = product.options.find(
			(o) => o.name.toLowerCase() === "sizes"
		);
		const scentOpt = product.options.find(
			(o) => o.name.toLowerCase() === "scents"
		);

		function numOrStr(val) {
			return typeof val === "number" ? val : parseInt(val, 10);
		}

		let chosenColorId = null;
		if (colorOpt && colorTitle) {
			const colorVal = colorOpt.values.find((v) => v.title === colorTitle);
			if (!colorVal) return false;
			chosenColorId = numOrStr(colorVal.id);
		}

		let chosenSizeId = null;
		if (sizeOpt && chosenSize) {
			const sVal = sizeOpt.values.find((v) => v.title === chosenSize);
			if (sVal) chosenSizeId = numOrStr(sVal.id);
		}

		let chosenScentId = null;
		if (scentOpt && chosenScent) {
			const scVal = scentOpt.values.find((v) => v.title === chosenScent);
			if (scVal) chosenScentId = numOrStr(scVal.id);
		}

		return product.variants.some((v) => {
			const varIds = v.options.map(numOrStr);
			if (chosenColorId != null && !varIds.includes(chosenColorId)) {
				return false;
			}
			if (chosenSizeId != null && !varIds.includes(chosenSizeId)) {
				return false;
			}
			if (chosenScentId != null && !varIds.includes(chosenScentId)) {
				return false;
			}
			return true;
		});
	}

	/**
	 * We already have "variantExistsForOption" for size:
	 */
	function variantExistsForOption(sizeObj, colorTitle, scentTitle) {
		if (!product) return false;

		const colorOpt = product.options.find(
			(o) => o.name.toLowerCase() === "colors"
		);
		const scentOpt = product.options.find(
			(o) => o.name.toLowerCase() === "scents"
		);

		function numOrStr(val) {
			return typeof val === "number" ? val : parseInt(val, 10);
		}

		let chosenColorId = null;
		if (colorOpt && colorTitle) {
			const colorVal = colorOpt.values.find((v) => v.title === colorTitle);
			if (!colorVal) return false;
			chosenColorId = numOrStr(colorVal.id);
		}

		let sizeValId = sizeObj ? numOrStr(sizeObj.id) : null;
		let chosenScentId = null;
		if (scentOpt && scentTitle) {
			const scVal = scentOpt.values.find((v) => v.title === scentTitle);
			if (scVal) chosenScentId = numOrStr(scVal.id);
		}

		return product.variants.some((v) => {
			const varIds = v.options.map(numOrStr);
			if (chosenColorId != null && !varIds.includes(chosenColorId)) {
				return false;
			}
			if (sizeValId != null && !varIds.includes(sizeValId)) {
				return false;
			}
			if (chosenScentId != null && !varIds.includes(chosenScentId)) {
				return false;
			}
			return true;
		});
	}

	function variantExistsForScent(scentObj, colorTitle, sizeTitle) {
		if (!product) return false;
		const colorOpt = product.options.find(
			(o) => o.name.toLowerCase() === "colors"
		);
		const sizeOpt = product.options.find(
			(o) => o.name.toLowerCase() === "sizes"
		);

		function numOrStr(val) {
			return typeof val === "number" ? val : parseInt(val, 10);
		}

		let chosenColorId = null;
		if (colorOpt && colorTitle) {
			const colorVal = colorOpt.values.find((v) => v.title === colorTitle);
			if (!colorVal) return false;
			chosenColorId = numOrStr(colorVal.id);
		}
		let chosenSizeId = null;
		if (sizeOpt && sizeTitle) {
			const sizeVal = sizeOpt.values.find((v) => v.title === sizeTitle);
			if (sizeVal) chosenSizeId = numOrStr(sizeVal.id);
		}
		let thisScentId = scentObj ? numOrStr(scentObj.id) : null;
		if (!thisScentId) return false;

		return product.variants.some((v) => {
			const varIds = v.options.map(numOrStr);

			if (chosenColorId != null && !varIds.includes(chosenColorId)) {
				return false;
			}
			if (chosenSizeId != null && !varIds.includes(chosenSizeId)) {
				return false;
			}
			if (!varIds.includes(thisScentId)) {
				return false;
			}
			return true;
		});
	}

	/**
	 * 4) IMAGE UPLOAD LOGIC
	 */
	function handleBlankAreaDoubleClick(e) {
		if (!e.target.closest(".rnd-element")) {
			setUserJustDoubleClickedCanvas(true);
			setTimeout(() => setUserJustDoubleClickedCanvas(false), 500);
		}
	}

	const addImageElement = async (file) => {
		// if .mov => error
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
			// 1) heic => jpeg
			let workingFile = await convertHeicToJpegIfNeeded(file);

			// 2) direct
			try {
				await uploadDirectly(workingFile);
			} catch (err1) {
				console.warn("Direct upload failed; try resizing...", err1);
				try {
					await handleImageResizingThenUpload(workingFile);
				} catch (err2) {
					console.warn("Resizing failed; fallback to canvas...", err2);
					try {
						const fallbackFile = await fallbackCanvasConvert(workingFile);
						await uploadDirectly(fallbackFile);
					} catch (err3) {
						console.warn(
							"Canvas fallback also failed; try dom-to-image...",
							err3
						);
						try {
							const fallbackFile2 =
								await fallbackDomToImageConvert(workingFile);
							await uploadDirectly(fallbackFile2);
						} catch (err4) {
							console.warn(
								"dom-to-image fallback also failed => final attempt XHR.",
								err4
							);
							try {
								const { public_id, url } = await fallbackVanillaJSXHRUpload(
									workingFile,
									fallbackUserId,
									fallbackToken
								);
								addImageElementToCanvas(public_id, url);
							} catch (finalErr) {
								console.error(
									"All fallback attempts for upload failed!",
									finalErr
								);
								// try requestImagePermissions => re-try
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
								} catch (permFail) {
									console.error(
										"Even after permissions, final attempt failed.",
										permFail
									);
									message.error(
										"We encountered an issue uploading your image. Please try again or pick a different photo."
									);
								}
							}
						}
					}
				}
			}
		} catch (finalErr) {
			console.error("Image upload (all attempts) failed:", finalErr);
			message.error(
				"We encountered an issue uploading your image. Please try again."
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
			throw new Error("Missing public_id or url from direct upload response");
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
	 * 5) TEXT + ELEMENT EDITING
	 */
	function addTextElement(textValue, fromRightSide = false) {
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
		function numOrStr(x) {
			return typeof x === "number" ? x : parseInt(x, 10);
		}
		// gather chosen
		const colorOpt = product.options.find(
			(o) => o.name.toLowerCase() === "colors"
		);
		const sizeOpt = product.options.find(
			(o) => o.name.toLowerCase() === "sizes"
		);
		const scentOpt = product.options.find(
			(o) => o.name.toLowerCase() === "scents"
		);

		const chosenIds = [];
		if (colorOpt && selectedColor) {
			const cVal = colorOpt.values.find((v) => v.title === selectedColor);
			if (cVal) chosenIds.push(numOrStr(cVal.id));
		}
		if (sizeOpt && selectedSize) {
			const sVal = sizeOpt.values.find((v) => v.title === selectedSize);
			if (sVal) chosenIds.push(numOrStr(sVal.id));
		}
		if (scentOpt && selectedScent) {
			const scVal = scentOpt.values.find((v) => v.title === selectedScent);
			if (scVal) chosenIds.push(numOrStr(scVal.id));
		}
		const matchingVariant = product.variants.find((v) => {
			const varIds = v.options.map(numOrStr);
			return chosenIds.every((cid) => varIds.includes(cid));
		});
		if (matchingVariant && typeof matchingVariant.price === "number") {
			return parseFloat(matchingVariant.price / 100);
		}
		if (typeof product.price === "number") {
			return parseFloat(product.price);
		}
		return 0;
	}
	const displayedPrice = `$${getVariantPrice().toFixed(2)}`;

	// Filter the images based on color
	const filteredImages = useMemo(() => {
		if (!product) return [];
		const colorOpt = product.options.find(
			(o) => o.name.toLowerCase() === "colors"
		);
		if (!selectedColor || !colorOpt) {
			return product.images.slice(0, 6);
		}
		function numOrStr(x) {
			return typeof x === "number" ? x : parseInt(x, 10);
		}
		const colorVal = colorOpt.values.find((v) => v.title === selectedColor);
		if (!colorVal) return product.images.slice(0, 6);

		const matchingVars = product.variants.filter((v) => {
			const varIds = v.options.map(numOrStr);
			return varIds.includes(numOrStr(colorVal.id));
		});
		const matchingIds = matchingVars.map((mv) => mv.id);
		const filtered = product.images.filter((img) =>
			img.variant_ids.some((id) => matchingIds.includes(id))
		);
		return filtered.length ? filtered.slice(0, 6) : product.images.slice(0, 6);
	}, [product, selectedColor]);

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
	 * 6) ADD TO CART => SCREENSHOT
	 */
	/**
	 * 6) ADD TO CART => SCREENSHOT
	 */
	async function handleAddToCart() {
		/* ── Step 0: remove default placeholder text, if still present ────────── */
		setElements((prev) =>
			prev.filter(
				(el) =>
					!(el.type === "text" && el.text.trim() === "Start typing here...")
			)
		);
		// wait a tick so the DOM reflects the removal before capture
		await new Promise((res) => setTimeout(res, 50));

		/* ── early guards ─────────────────────────────────────────────────────── */
		if (isAddToCartDisabled) return;
		if (!order.variant_id) {
			message.warning("Please select required options before adding to cart.");
			return;
		}
		setIsAddToCartDisabled(true);

		/* ── Step 1: deselect everything (so outlines aren’t captured) ────────── */
		const previouslySelected = selectedElementId;
		setSelectedElementId(null);
		await new Promise((res) => setTimeout(res, 50));

		/* ── Step 2: try to capture screenshots (html2canvas → dom‑to‑image) ──── */
		let bareUrl, finalUrl;
		try {
			const screenshotOptions = {
				scale: isMobile ? 2 : 3,
				useCORS: true,
				allowTaint: false,
				ignoreElements: (el) => el.classList?.contains("noScreenshot"),
				backgroundColor: null,
			};

			/* bare print‑area only */
			const bareCanvas = await html2canvas(
				bareDesignRef.current,
				screenshotOptions
			);
			const croppedBare = cropCanvasToTransparentBounds(bareCanvas);
			const bareDataURL = await compressCanvas(croppedBare, {
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

			/* final overlay (base image + user elements) */
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
		} catch (errHtml) {
			console.warn("html2canvas failed, falling back …", errHtml);
			try {
				const domOptions = {
					quality: 0.9,
					bgcolor: null,
					style: { transform: "scale(2)", transformOrigin: "top left" },
					filter: (node) => !node.classList?.contains("noScreenshot"),
				};

				const bareBlob = await domtoimage.toBlob(
					bareDesignRef.current,
					domOptions
				);
				const bareCanvas = await blobToCanvas(bareBlob);
				const bareDataURL = await compressCanvas(bareCanvas, {
					mimeType: "image/jpeg",
					quality: 0.9,
				});
				bareUrl = (
					await cloudinaryUpload1(fallbackUserId, fallbackToken, {
						image: bareDataURL,
					})
				).url;

				const finalBlob = await domtoimage.toBlob(
					designOverlayRef.current,
					domOptions
				);
				const finalCanvas = await blobToCanvas(finalBlob);
				const finalDataURL = await compressCanvas(finalCanvas, {
					mimeType: "image/jpeg",
					quality: 0.9,
				});
				finalUrl = (
					await cloudinaryUpload1(fallbackUserId, fallbackToken, {
						image: finalDataURL,
					})
				).url;
			} catch (errDom) {
				console.error("All screenshot attempts failed.", errDom);
				message.error(
					"Screenshot attempts failed. Please refresh the page or try another device."
				);
				setSelectedElementId(previouslySelected);
				setIsAddToCartDisabled(false);
				return;
			}
		}

		/* ── guard: both URLs must exist ──────────────────────────────────────── */
		if (!bareUrl || !finalUrl) {
			message.error(
				"Screenshot attempts failed. Please refresh the page or try another device."
			);
			setSelectedElementId(previouslySelected);
			setIsAddToCartDisabled(false);
			return;
		}

		/* ── Step 3: rebuild variant‑price info, assemble customDesign payload ── */
		// helper to coerce ids
		const numOrStr = (v) => (typeof v === "number" ? v : parseInt(v, 10));

		const colorOpt = product.options.find(
			(o) => o.name.toLowerCase() === "colors"
		);
		const sizeOpt = product.options.find(
			(o) => o.name.toLowerCase() === "sizes"
		);
		const scentOpt = product.options.find(
			(o) => o.name.toLowerCase() === "scents"
		);

		const chosenIds = [];
		if (colorOpt && selectedColor) {
			const cVal = colorOpt.values.find((v) => v.title === selectedColor);
			if (cVal) chosenIds.push(numOrStr(cVal.id));
		}
		if (sizeOpt && selectedSize) {
			const sVal = sizeOpt.values.find((v) => v.title === selectedSize);
			if (sVal) chosenIds.push(numOrStr(sVal.id));
		}
		if (scentOpt && selectedScent) {
			const scVal = scentOpt.values.find((v) => v.title === selectedScent);
			if (scVal) chosenIds.push(numOrStr(scVal.id));
		}

		const matchingVariant = product.variants.find((v) =>
			chosenIds.every((id) => v.options.map(numOrStr).includes(id))
		);

		/* price & variant image */
		let finalPrice = product.price || 0;
		let finalPriceAfterDiscount = product.priceAfterDiscount || finalPrice;
		let variantImage = "";
		if (matchingVariant) {
			finalPrice = matchingVariant.price / 100;
			finalPriceAfterDiscount = finalPrice;
			const matchImg = product.images.find((img) =>
				img.variant_ids.includes(matchingVariant.id)
			);
			if (matchImg) variantImage = matchImg.src;
		}

		const customDesign = {
			bareScreenshotUrl: bareUrl,
			finalScreenshotUrl: finalUrl,
			originalPrintifyImageURL: variantImage,
			size: selectedSize,
			color: selectedColor,
			scent: selectedScent,
			printArea: "front",
			PrintifyProductId: product.printifyProductDetails?.id || null,
			variants: {
				color: colorOpt
					? colorOpt.values.find((c) => c.title === selectedColor)
					: null,
				size: sizeOpt
					? sizeOpt.values.find((s) => s.title === selectedSize)
					: null,
				scent: scentOpt
					? scentOpt.values.find((s) => s.title === selectedScent)
					: null,
			},
		};

		const chosenProductAttributes = {
			SubSKU: String(Date.now()),
			color: selectedColor,
			size: selectedSize,
			scent: selectedScent,
			quantity: 999,
			productImages: [],
			price: finalPrice,
			priceAfterDiscount: finalPriceAfterDiscount,
		};

		/* ── Step 4: push to cart & emit analytics ───────────────────────────── */
		addToCart(
			product._id,
			selectedColor,
			1,
			product,
			chosenProductAttributes,
			customDesign
		);

		try {
			if (ReactGA?.event) {
				ReactGA.event({
					category: "Add To The Cart Custom Products",
					action: "User Added Product From The Custom Products",
					label: `User added ${product.productName} to the cart`,
				});
				const eventId = `AddToCart-print-on-demand-${product._id}-${Date.now()}`;
				ReactPixel.track("AddToCart", {
					content_name: product.title || product.productName,
					content_ids: [product._id],
					content_type: "product",
					currency: "USD",
					value: finalPriceAfterDiscount,
					contents: [{ id: product._id, quantity: 1 }],
					eventID: eventId,
				});
				await axios.post(
					`${process.env.REACT_APP_API_URL}/facebookpixel/conversionapi`,
					{
						eventName: "AddToCart",
						eventId,
						email: user?.email || null,
						phone: user?.phone || null,
						currency: "USD",
						value: finalPriceAfterDiscount,
						contentIds: [product._id],
						userAgent: window.navigator.userAgent,
					}
				);
			}
		} catch (analyticsErr) {
			console.error("Analytics error", analyticsErr);
		}

		openSidebar2();
		message.success("Added to cart with custom design!");
		setDidUserAddToCart(true);

		/* ── finally: restore selection & button state ───────────────────────── */
		setSelectedElementId(previouslySelected);
		setIsAddToCartDisabled(false);
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

	useEffect(() => {
		if (selectedElementId) {
			const el = elements.find((e) => e.id === selectedElementId);
			if (el && el.type === "text") {
				setShowTooltipForText(selectedElementId);
				const timer = setTimeout(() => setShowTooltipForText(null), 5000);
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

	const canonicalUrl = `https://serenejannat.com/custom-gifts/${productId}`;
	const metaTitle = `${product.title || product.productName} | Customize`;
	const rawMetaDescription =
		product.printifyProductDetails?.description ||
		product.description ||
		"Customize this product with your own designs!";
	const normalizedMetaDescription = stripHtmlTags(rawMetaDescription)
		.replace(/\s+/g, " ")
		.trim();
	const metaDescription =
		normalizedMetaDescription.length > 155
			? `${normalizedMetaDescription.slice(0, 152).trim()}...`
			: normalizedMetaDescription;
	const metaImage =
		filteredImages?.[0]?.src ||
		product.images?.[0]?.src ||
		product.thumbnailImage?.[0]?.images?.[0]?.url ||
		"https://serenejannat.com/logo192.png";

	// color/size/scent option objects:
	const colorOpt = product.options.find(
		(o) => o.name.toLowerCase() === "colors"
	);
	const sizeOpt = product.options.find((o) => o.name.toLowerCase() === "sizes");
	const scentOpt = product.options.find(
		(o) => o.name.toLowerCase() === "scents"
	);

	return (
		<CustomizeWrapper>
			<Helmet>
				<title>{metaTitle}</title>
				<meta name='description' content={metaDescription} />
				<meta name='keywords' content='Print On Demand, Custom Gift' />
				<link rel='canonical' href={canonicalUrl} />
				<meta property='og:title' content={metaTitle} />
				<meta property='og:description' content={metaDescription} />
				<meta property='og:image' content={metaImage} />
				<meta property='og:url' content={canonicalUrl} />
				<meta property='og:type' content='product' />
				<meta name='twitter:card' content='summary_large_image' />
				<meta name='twitter:title' content={metaTitle} />
				<meta name='twitter:description' content={metaDescription} />
				<meta name='twitter:image' content={metaImage} />
				<meta name='twitter:url' content={canonicalUrl} />
				<script
					type='application/ld+json'
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@type": "Organization",
							url: "https://serenejannat.com",
							name: "Serene Jannat",
							logo: "https://serenejannat.com/logo192.png",
							sameAs: [
								"https://www.facebook.com/profile.php?id=61575325586166",
							],
						}),
					}}
				/>
			</Helmet>

			{/* Child Animation/Tutorial */}
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
					isSomethingSelected={!!selectedElementId}
					userJustDoubleClickedCanvas={userJustDoubleClickedCanvas}
					userJustSingleClickedText={userJustSingleClickedText}
					hasMultipleSizeOrColor={hasMultipleSizeOrColor}
					onUserAddToCart={handleAddToCart}
					onUserUploadPhoto={() => {
						hiddenGalleryInputRef.current?.click();
					}}
					// color, size, scent
					onHandleColorChange={setSelectedColor}
					onHandleSizeChange={setSelectedSize}
					onHandleScentChange={setSelectedScent}
					colorOptions={colorOpt?.values.map((v) => v.title) || []}
					sizeOptions={sizeOpt?.values.map((v) => v.title) || []}
					scentOptions={scentOpt?.values.map((v) => v.title) || []}
					selectedColor={selectedColor}
					selectedSize={selectedSize}
					selectedScent={selectedScent}
					// Provide the 3 "variantExists" functions
					variantExistsForColor={variantExistsForColor}
					variantExistsForSize={variantExistsForOption}
					variantExistsForScent={variantExistsForScent}
				/>
			</AnimationPODWalkThroughWrapper>

			<Row gutter={[18, 20]}>
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
												{colorOpt?.values?.length > 0 && (
													<Select
														style={{ width: "100%", marginBottom: 8 }}
														placeholder='Color'
														value={selectedColor}
														onChange={(val) => {
															setSelectedColor(val);
															setHasChangedSizeOrColor(true);
														}}
													>
														{colorOpt.values.map((cObj) => (
															<Option key={cObj.title} value={cObj.title}>
																{cObj.title}
															</Option>
														))}
													</Select>
												)}

												{sizeOpt?.values?.length > 0 && (
													<Select
														style={{ width: "100%", marginBottom: 8 }}
														placeholder='Size'
														value={selectedSize}
														onChange={(val) => {
															setSelectedSize(val);
															setHasChangedSizeOrColor(true);
														}}
													>
														{sizeOpt.values.map((sizeObj) => {
															const isDisabled = !variantExistsForOption(
																sizeObj,
																selectedColor,
																selectedScent
															);
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

												{/* SCENT if present */}
												{scentOpt?.values?.length > 0 && (
													<Select
														style={{ width: "100%" }}
														placeholder='Scent'
														value={selectedScent}
														onChange={(val) => {
															setSelectedScent(val);
															setHasChangedSizeOrColor(true);
														}}
													>
														{scentOpt.values.map((scObj) => {
															const isDisabled = !variantExistsForScent(
																scObj,
																selectedColor,
																selectedSize
															);
															return (
																<Option
																	key={scObj.title}
																	value={scObj.title}
																	disabled={isDisabled}
																	style={{
																		color: isDisabled ? "#aaa" : "inherit",
																	}}
																>
																	{scObj.title}
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
																ReactPixel.track("CustomizeProduct", {
																	content_name:
																		product.title || product.productName,
																	content_ids: [product._id],
																	content_type: "product",
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
																ReactPixel.track("CustomizeProduct", {
																	content_name:
																		product.title || product.productName,
																	content_ids: [product._id],
																	content_type: "product",
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
							{colorOpt?.values?.length > 0 && (
								<Col span={12}>
									<Select
										style={{ width: "100%" }}
										className='selectDesktopOrMobile'
										placeholder='Color'
										value={selectedColor}
										onChange={(val) => {
											setSelectedColor(val);
											setHasChangedSizeOrColor(true);
										}}
									>
										{colorOpt.values.map((cObj) => (
											<Option key={cObj.title} value={cObj.title}>
												{cObj.title}
											</Option>
										))}
									</Select>
								</Col>
							)}

							{sizeOpt?.values?.length > 0 && (
								<Col span={12}>
									<Select
										style={{ width: "100%" }}
										className='selectDesktopOrMobile'
										placeholder='Size'
										value={selectedSize}
										onChange={(val) => {
											setSelectedSize(val);
											setHasChangedSizeOrColor(true);
										}}
									>
										{sizeOpt.values.map((sizeObj) => {
											const isDisabled = !variantExistsForOption(
												sizeObj,
												selectedColor,
												selectedScent
											);
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

						{/* Scent if any */}
						{scentOpt?.values?.length > 0 && (
							<Row gutter={12} style={{ marginTop: 16 }}>
								<Col span={24}>
									<Title
										level={4}
										style={{ color: "var(--text-color-dark)", marginBottom: 8 }}
									>
										Scent:
									</Title>
									<Select
										style={{ width: "100%" }}
										className='selectDesktopOrMobile'
										placeholder='Scent'
										value={selectedScent}
										onChange={(val) => {
											setSelectedScent(val);
											setHasChangedSizeOrColor(true);
										}}
									>
										{scentOpt.values.map((scObj) => {
											const isDisabled = !variantExistsForScent(
												scObj,
												selectedColor,
												selectedSize
											);
											return (
												<Option
													key={scObj.title}
													value={scObj.title}
													disabled={isDisabled}
													style={{ color: isDisabled ? "#aaa" : "inherit" }}
												>
													{scObj.title}
												</Option>
											);
										})}
									</Select>
								</Col>
							</Row>
						)}

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
							{colorOpt?.values?.length > 0 && (
								<Col span={12}>
									<Select
										style={{ width: "100%" }}
										placeholder='Color'
										value={selectedColor}
										onChange={(val) => {
											setSelectedColor(val);
											setHasChangedSizeOrColor(true);
										}}
									>
										{colorOpt.values.map((cObj) => (
											<Option key={cObj.title} value={cObj.title}>
												{cObj.title}
											</Option>
										))}
									</Select>
								</Col>
							)}

							{sizeOpt?.values?.length > 0 && (
								<Col span={12}>
									<Select
										style={{ width: "100%" }}
										placeholder='Size'
										value={selectedSize}
										onChange={(val) => {
											setSelectedSize(val);
											setHasChangedSizeOrColor(true);
										}}
									>
										{sizeOpt.values.map((sizeObj) => {
											const isDisabled = !variantExistsForOption(
												sizeObj,
												selectedColor,
												selectedScent
											);
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

						{/* Scent if any */}
						{scentOpt?.values?.length > 0 && (
							<>
								<Divider style={{ margin: "16px 0" }} />
								<Title level={4} style={{ color: "var(--text-color-dark)" }}>
									Scent
								</Title>
								<Select
									style={{ width: "100%" }}
									placeholder='Scent'
									value={selectedScent}
									onChange={(val) => {
										setSelectedScent(val);
										setHasChangedSizeOrColor(true);
									}}
								>
									{scentOpt.values.map((scObj) => {
										const isDisabled = !variantExistsForScent(
											scObj,
											selectedColor,
											selectedSize
										);
										return (
											<Option
												key={scObj.title}
												value={scObj.title}
												disabled={isDisabled}
												style={{ color: isDisabled ? "#aaa" : "inherit" }}
											>
												{scObj.title}
											</Option>
										);
									})}
								</Select>
							</>
						)}

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

	/**
	 * Renders the draggable design elements in the main “printArea”
	 */
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
 * STYLED COMPONENTS
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
	z-index: 1;

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
