import {
	ADD_TO_CART,
	CLEAR_CART,
	COUNT_CART_TOTALS,
	REMOVE_CART_ITEM,
	TOGGLE_CART_ITEM_AMOUNT,
	SIDEBAR_OPEN,
	SIDEBAR_CLOSE,
	SIDEBAR_OPEN2,
	SIDEBAR_CLOSE2,
	SHIPPING_FEES,
	SHIPPING_DETAILS,
	CHANGE_COLOR,
	CHANGE_SIZE,
	SIDEFILTERS_OPEN,
	SIDEFILTERS_CLOSE,
} from "./actions";

const cart_reducer = (state, action) => {
	if (action.type === SIDEBAR_OPEN) {
		return { ...state, isSidebarOpen: true };
	}
	if (action.type === SIDEBAR_CLOSE) {
		window.scrollTo({ top: 0, behavior: "smooth" });
		return { ...state, isSidebarOpen: false };
	}

	if (action.type === SIDEBAR_OPEN2) {
		return { ...state, isSidebarOpen2: true };
	}
	if (action.type === SIDEBAR_CLOSE2) {
		window.scrollTo({ top: 0, behavior: "smooth" });
		return { ...state, isSidebarOpen2: false };
	}

	if (action.type === SIDEFILTERS_OPEN) {
		return { ...state, isSideFilterOpen: true };
	}
	if (action.type === SIDEFILTERS_CLOSE) {
		return { ...state, isSideFilterOpen: false };
	}

	if (action.type === ADD_TO_CART) {
		const { id, amount, product, chosenProductAttributes } = action.payload;

		// Check if the product has variations
		if (product.addVariables) {
			// For products with variations
			const tempItem = state.cart.find(
				(i) =>
					i.id === id &&
					chosenProductAttributes.SubSKU === i.chosenProductAttributes.SubSKU
			);
			if (tempItem) {
				const tempCart = state.cart.map((cartItem) => {
					if (
						cartItem.id === id &&
						chosenProductAttributes.SubSKU ===
							cartItem.chosenProductAttributes.SubSKU
					) {
						let newAmount = cartItem.amount + amount;
						if (newAmount > cartItem.max) {
							newAmount = cartItem.max;
						}
						return { ...cartItem, amount: newAmount };
					} else {
						return cartItem;
					}
				});

				return { ...state, cart: tempCart };
			} else {
				const newItem = {
					id: id,
					_id: product._id,
					name: product.productName,
					nameArabic: product.productName_Arabic,
					color: chosenProductAttributes.color,
					size: chosenProductAttributes.size,
					amount,
					image:
						chosenProductAttributes.productImages &&
						chosenProductAttributes.productImages.length > 0
							? chosenProductAttributes.productImages[0].url
							: product.thumbnailImage[0].images[0].url,
					price: chosenProductAttributes.price,
					priceAfterDiscount: chosenProductAttributes.priceAfterDiscount,
					max: chosenProductAttributes.quantity,
					loyaltyPoints: product.loyaltyPoints,
					slug: product.slug,
					categorySlug: product.category.categorySlug,
					categoryName: product.category.categoryName,
					categoryNameArabic: product.category.categoryName_Arabic,
					relatedProducts: product.relatedProducts,
					allProductDetailsIncluded: product,
					chosenProductAttributes: chosenProductAttributes,
					isPrintifyProduct: product.isPrintifyProduct,
					printifyProductDetails: product.printifyProductDetails,
				};
				return { ...state, cart: [...state.cart, newItem] };
			}
		} else {
			// For products without variations
			const tempItem = state.cart.find((i) => i.id === id);
			if (tempItem) {
				const tempCart = state.cart.map((cartItem) => {
					if (cartItem.id === id) {
						let newAmount = cartItem.amount + amount;
						if (newAmount > cartItem.max) {
							newAmount = cartItem.max;
						}
						return { ...cartItem, amount: newAmount };
					} else {
						return cartItem;
					}
				});

				return { ...state, cart: tempCart };
			} else {
				const newItem = {
					id: id,
					_id: product._id,
					name: product.productName,
					nameArabic: product.productName_Arabic,
					amount,
					image: product.thumbnailImage[0].images[0].url,
					price: product.price,
					priceAfterDiscount: product.priceAfterDiscount,
					max: product.quantity,
					loyaltyPoints: product.loyaltyPoints,
					slug: product.slug,
					categorySlug: product.category.categorySlug,
					categoryName: product.category.categoryName,
					categoryNameArabic: product.category.categoryName_Arabic,
					relatedProducts: product.relatedProducts,
					allProductDetailsIncluded: product,
					isPrintifyProduct: product.isPrintifyProduct,
					printifyProductDetails: product.printifyProductDetails,
				};
				return { ...state, cart: [...state.cart, newItem] };
			}
		}
	}

	if (action.type === REMOVE_CART_ITEM) {
		const { id, size, color } = action.payload;

		// Use optional chaining and fallback to empty strings if undefined
		const tempCart = state.cart.filter(
			(item) =>
				!(
					item.id === id &&
					(item.size?.toLowerCase() ?? "") +
						" " +
						(item.color?.toLowerCase() ?? "") ===
						(size?.toLowerCase() ?? "") + " " + (color?.toLowerCase() ?? "")
				)
		);

		return { ...state, cart: tempCart };
	}

	if (action.type === CLEAR_CART) {
		return { ...state, cart: [] };
	}

	if (action.type === TOGGLE_CART_ITEM_AMOUNT) {
		const { id, value, chosenAttribute, newMax } = action.payload;

		const tempCart = state.cart.map((item) => {
			if (item.id === id) {
				// Handle products with variations
				if (chosenAttribute) {
					if (chosenAttribute.SubSKU === item.chosenProductAttributes.SubSKU) {
						let newAmount = item.amount;
						if (value === "inc") {
							newAmount = Math.min(item.amount + 1, newMax);
						} else if (value === "dec") {
							newAmount = Math.max(item.amount - 1, 1);
						}
						return { ...item, amount: newAmount };
					}
				} else {
					// Handle products without variations
					let newAmount = item.amount;
					if (value === "inc") {
						newAmount = Math.min(item.amount + 1, item.max);
					} else if (value === "dec") {
						newAmount = Math.max(item.amount - 1, 1);
					}
					return { ...item, amount: newAmount };
				}
			}
			return item;
		});

		return { ...state, cart: tempCart };
	}

	if (action.type === COUNT_CART_TOTALS) {
		const { total_items, total_amount } = state.cart.reduce(
			(total, cartItem) => {
				const { amount, priceAfterDiscount } = cartItem;

				total.total_items += amount;
				total.total_amount += priceAfterDiscount * amount;
				return total;
			},
			{
				total_items: 0,
				total_amount: 0,
			}
		);
		return { ...state, total_items, total_amount };
	}

	if (action.type === SHIPPING_FEES) {
		const { ShippingPrice } = action.payload;
		return { ...state, shipping_fee: ShippingPrice };
	}

	if (action.type === SHIPPING_DETAILS) {
		const { chosenShipmentDetails } = action.payload;
		const shippingPrice = chosenShipmentDetails.shippingPrice || 0;
		const total_amount =
			state.cart.reduce(
				(total, item) => total + item.priceAfterDiscount * item.amount,
				0
			) + shippingPrice;

		return {
			...state,
			shipmentChosen: chosenShipmentDetails,
			total_amount,
		};
	}

	if (action.type === CHANGE_COLOR) {
		const { id, color, size, chosenColorImage, quantity, prevColor } =
			action.payload;
		const tempCart = state.cart.map((item) => {
			const chosenAttribute =
				item.allProductDetailsIncluded.productAttributes.filter(
					(i) => i.color === color && i.size === size
				)[0];

			if (item.id === id && item.size === size && item.color === prevColor) {
				let newColor = color;
				return {
					...item,
					image: chosenColorImage ? chosenColorImage : item.image,
					max: quantity,
					color: newColor,
					chosenProductAttributes: chosenAttribute,
				};
			}
			return item;
		});

		return { ...state, cart: tempCart };
	}

	if (action.type === CHANGE_SIZE) {
		const { id, size, color, quantity, prevSize } = action.payload;
		const tempCart = state.cart.map((item) => {
			const chosenAttribute =
				item.allProductDetailsIncluded.productAttributes.filter(
					(i) => i.color === color && i.size === size
				)[0];

			if (item.id === id && item.color === color && item.size === prevSize) {
				let newSize = size;
				return {
					...item,
					size: newSize,
					max: quantity,
					chosenProductAttributes: chosenAttribute,
				};
			}
			return item;
		});

		return { ...state, cart: tempCart };
	}

	throw new Error(`No Matching "${action.type}" - action type`);
};

export default cart_reducer;
