/** @format */

export const allLoyaltyPointsAndStoreStatus = (token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/store-management`, {
		method: "GET",
		headers: {
			// content type?
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const getProducts = () => {
	return fetch(`${process.env.REACT_APP_API_URL}/products`, {
		method: "GET",
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const getShippingOptions = (token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/shipping-options`, {
		method: "GET",
		headers: {
			// content type?
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const readShippingOption = (shippingId) => {
	return fetch(`${process.env.REACT_APP_API_URL}/shipping/${shippingId}`, {
		method: "GET",
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const getSortedProducts = (sortBy) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/products?sortBy=${sortBy}&order=desc&limit=8`,
		{
			method: "GET",
		}
	)
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const readProduct = (productId) => {
	return fetch(`${process.env.REACT_APP_API_URL}/product/${productId}`, {
		method: "GET",
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

/** @format */

export const read = (userId, token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/user/${userId}`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const update = (userId, token, user) => {
	return fetch(`${process.env.REACT_APP_API_URL}/user/${userId}`, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(user),
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const updateFromAdmin = (userId, token, user) => {
	return fetch(`${process.env.REACT_APP_API_URL}/user/admin/${userId}`, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(user),
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const getPurchaseHistory = (userId, token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/order/history/${userId}`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const userlike = (userId, token, productId) => {
	return fetch(`${process.env.REACT_APP_API_URL}/user/like`, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ userId, productId }),
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const userunlike = (userId, token, productId) => {
	return fetch(`${process.env.REACT_APP_API_URL}/user/unlike`, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ userId, productId }),
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const updateUser = (user, next) => {
	if (typeof window !== "undefined") {
		if (localStorage.getItem("jwt")) {
			let auth = JSON.parse(localStorage.getItem("jwt"));
			auth.user = user;
			localStorage.setItem("jwt", JSON.stringify(auth));
			next();
		}
	}
};

export const productStar = (productId, star, token, email, userId) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/product/star/${productId}/${userId}`,
		{
			method: "PUT",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ productId, star, email, userId }),
		}
	)
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const comment = (userId, token, productId, comment, commentsPhotos) => {
	return fetch(`${process.env.REACT_APP_API_URL}/post/comment`, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ userId, productId, comment, commentsPhotos }),
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const uncomment = (userId, token, productId, comment) => {
	return fetch(`${process.env.REACT_APP_API_URL}/post/uncomment`, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ userId, productId, comment }),
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const like = (userId, token, productId) => {
	return fetch(`${process.env.REACT_APP_API_URL}/post/like`, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ userId, productId }),
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const unlike = (userId, token, productId) => {
	return fetch(`${process.env.REACT_APP_API_URL}/post/unlike`, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ userId, productId }),
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const views = (productId) => {
	return fetch(`${process.env.REACT_APP_API_URL}/views`, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ productId }),
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const viewsCounter = (productId, counter) => {
	return fetch(`${process.env.REACT_APP_API_URL}/viewscounter`, {
		method: "PUT",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ productId, counter }),
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const getColors = (token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/colors`, {
		method: "GET",
		headers: {
			// content type?
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const createOrder = (token, createOrderData, paymentToken, userId) => {
	return fetch(`${process.env.REACT_APP_API_URL}/order/creation/${userId}`, {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ orderData: createOrderData, paymentToken }),
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const readSingleCoupon = (coupon) => {
	return fetch(`${process.env.REACT_APP_API_URL}/coupon/byname/${coupon}`, {
		method: "GET",
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const getAllAds = (token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/all-adds`, {
		method: "GET",
		headers: {
			// content type?
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const getAllHeros = (token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/heroes`, {
		method: "GET",
		headers: {
			// content type?
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const getContacts = (token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/contact`, {
		method: "GET",
		headers: {
			// content type?
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const getAbouts = (token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/about`, {
		method: "GET",
		headers: {
			// content type?
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const gettingCategoriesAndSubcategories = () => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/product/categories/subcategories`,
		{
			method: "GET",
			headers: {
				// content type?
				"Content-Type": "application/json",
				Accept: "application/json",
			},
		}
	)
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const gettingSpecificProducts = (
	featured,
	newArrivals,
	sortByRate,
	offers,
	records
) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/specific/products/${featured}/${newArrivals}/${sortByRate}/${offers}/${records}`,
		{
			method: "GET",
			headers: {
				Accept: "application/json",
			},
		}
	)
		.then((response) => {
			if (!response.ok) throw new Error("Network response was not ok");
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const gettingSingleProduct = (slug, categorySlug, productId) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/single-product/${slug}/${categorySlug}/${productId}`,
		{
			method: "GET",
			headers: {
				Accept: "application/json",
			},
		}
	)
		.then((response) => {
			if (!response.ok) throw new Error("Network response was not ok");
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const gettingFilteredProducts = (filters, page, records) => {
	return fetch(
		`${process.env.REACT_APP_API_URL}/products/${filters}/${page}/${records}`,
		{
			method: "GET",
		}
	)
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};

export const readSingleUserHistory = (userId, token) => {
	return fetch(`${process.env.REACT_APP_API_URL}/products/wishlist/${userId}`, {
		method: "GET",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
	})
		.then((response) => {
			return response.json();
		})
		.catch((err) => console.log(err));
};
