import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import ReactGA from "react-ga4";
import { Helmet } from "react-helmet";
// Context
import { useCartContext } from "../../cart_context";
// Ant Design Spinner
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

// Components
import ZCategories from "./ZCategories";
import ZFeaturedProducts from "./ZFeaturedProducts";
import ZNewArrival from "./ZNewArrival";
import ZCustomDesigns from "./ZCustomDesigns";
import Hero from "./Hero";
import {
	gettingCategoriesAndSubcategories,
	gettingSpecificProducts,
} from "../../apiCore";

/* Keyframes for the fade-up animation */
const fadeUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

/* Simple styled div that applies the fadeUp animation */
const FadeUpDiv = styled.div`
	animation: ${fadeUp} 1.2s ease-in-out;
`;

// Utility function to capitalize the first letter of each word
const capitalizeWords = (str = "") => {
	return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Utility function to escape JSON strings
const escapeJsonString = (str = "") => {
	return str
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n")
		.replace(/\r/g, "\\r")
		.replace(/\t/g, "\\t")
		.replace(/\b/g, "\\b")
		.replace(/\f/g, "\\f");
};

// Generate keywords from products array
const generateKeywords = (products = []) => {
	const categoryKeywords = products.map(
		(product) => product?.category?.categoryName || ""
	);
	const productKeywords = products.map((product) => product?.productName || "");
	return [...new Set([...categoryKeywords, ...productKeywords])].join(", ");
};

// Generate structured data for products
const generateProductSchema = (products = []) => {
	return products.map((product) => {
		const hasVariables =
			product?.productAttributes && product.productAttributes.length > 0;

		const price = hasVariables
			? product.productAttributes[0].priceAfterDiscount
			: product?.priceAfterDiscount || 0;

		const quantity = hasVariables
			? product.productAttributes.reduce((acc, attr) => acc + attr.quantity, 0)
			: product?.quantity || 0;

		const priceValidUntil = "2026-12-31";

		// Ratings
		const ratingValue =
			product?.ratings?.length > 0
				? (
						product.ratings.reduce((acc, rating) => acc + rating.star, 0) /
						product.ratings.length
					).toFixed(1)
				: "5.0";
		const reviewCount =
			product?.ratings?.length > 0 ? product.ratings.length : 1;

		// Reviews
		const reviews =
			product?.comments?.length > 0
				? product.comments.map((comment) => ({
						"@type": "Review",
						reviewRating: {
							"@type": "Rating",
							ratingValue: comment?.rating || 5,
							bestRating: 5,
							worstRating: 1,
						},
						author: {
							"@type": "Person",
							name: escapeJsonString(
								comment?.postedBy ? comment.postedBy.name : "Anonymous"
							),
						},
						reviewBody: escapeJsonString(comment?.text || ""),
						datePublished: new Date(comment.created).toISOString(),
					}))
				: [
						{
							"@type": "Review",
							reviewRating: {
								"@type": "Rating",
								ratingValue: 5,
								bestRating: 5,
								worstRating: 1,
							},
							author: {
								"@type": "Person",
								name: "Anonymous",
							},
							reviewBody: "Excellent product!",
							datePublished: new Date().toISOString(),
						},
					];

		// MPN
		const mpn = hasVariables
			? product.productAttributes
					.map((attr) => `${product?.productSKU || ""}-${attr.SubSKU || ""}`)
					.join(", ")
			: product?.productSKU || "N/A";

		const productSchema = {
			"@context": "http://schema.org",
			"@type": "Product",
			name: capitalizeWords(escapeJsonString(product?.productName || "")),
			image: product?.thumbnailImage?.[0]?.images?.[0]?.url || "",
			description: escapeJsonString(
				(product?.description || "").replace(/<[^>]+>/g, "")
			),
			brand: {
				"@type": "Brand",
				name: "Serene Jannat",
			},
			mpn,
			offers: {
				"@type": "Offer",
				priceCurrency: "USD",
				price: Number(price).toFixed(2),
				priceValidUntil,
				availability:
					quantity > 0
						? "http://schema.org/InStock"
						: "http://schema.org/OutOfStock",
				itemCondition: "http://schema.org/NewCondition",
				hasMerchantReturnPolicy: {
					"@type": "MerchantReturnPolicy",
					returnPolicyCategory:
						"https://schema.org/MerchantReturnFiniteReturnWindow",
					merchantReturnDays: 7,
					merchantReturnLink:
						"https://serenejannat.com/privacy-policy-terms-conditions",
					applicableCountry: {
						"@type": "Country",
						name: "US",
					},
					returnMethod: "https://schema.org/ReturnByMail",
					returnFees: "https://schema.org/FreeReturn",
				},
				shippingDetails: {
					"@type": "OfferShippingDetails",
					shippingRate: {
						"@type": "MonetaryAmount",
						value: "5.00",
						currency: "USD",
					},
					deliveryTime: {
						"@type": "ShippingDeliveryTime",
						handlingTime: {
							"@type": "QuantitativeValue",
							minValue: 0,
							maxValue: 1,
							unitCode: "d",
						},
						transitTime: {
							"@type": "QuantitativeValue",
							minValue: 3,
							maxValue: 7,
							unitCode: "d",
						},
					},
					shippingDestination: {
						"@type": "DefinedRegion",
						addressCountry: {
							"@type": "Country",
							name: "US",
						},
						geoMidpoint: {
							"@type": "GeoCoordinates",
							latitude: 37.7749,
							longitude: -122.4194,
						},
					},
				},
			},
			aggregateRating: {
				"@type": "AggregateRating",
				ratingValue,
				reviewCount,
			},
			review: reviews,
			productID: product?._id,
			url: `https://serenejannat.com/single-product/${product?.slug || ""}/${
				product?.category?.categorySlug || ""
			}/${product?._id}`,
		};

		// We set identifier_exists to false by default
		productSchema.identifier_exists = false;

		return productSchema;
	});
};

const HomePageHelmet = ({
	featuredProducts = [],
	newArrivalProducts = [],
	customDesignProducts = [],
}) => {
	const title = "Serene Jannat | Best Gifts and Candles Online Shop";
	const description =
		"Discover the best offers at Serene Jannat, your online gift store for candles, glass items, and more. Show love to your loved ones with our exquisite collection.";

	// Combine all arrays for broader SEO coverage
	const keywords = generateKeywords([
		...featuredProducts,
		...newArrivalProducts,
		...customDesignProducts,
	]);

	const productSchema = generateProductSchema([
		...featuredProducts,
		...newArrivalProducts,
		...customDesignProducts,
	]);

	return (
		<Helmet>
			<title>{title}</title>
			<meta name='description' content={description} />
			<meta name='keywords' content={keywords} />
			<meta property='og:title' content={title} />
			<meta property='og:description' content={description} />
			<meta
				property='og:image'
				content={
					featuredProducts?.[0]?.thumbnailImage?.[0]?.images?.[0]?.url || ""
				}
			/>
			<meta property='og:url' content='https://serenejannat.com' />
			<meta property='og:type' content='website' />
			<link rel='canonical' href='https://serenejannat.com' />
			<script type='application/ld+json'>
				{JSON.stringify(productSchema)}
			</script>
		</Helmet>
	);
};

/* Ant Design loading icon with custom size */
const loadingIcon = (
	<LoadingOutlined style={{ fontSize: 60, color: "#555" }} spin />
);

const Home = () => {
	const [categories, setCategories] = useState([]);
	const [subcategories, setSubcategories] = useState([]);
	const [featuredProducts, setFeaturedProducts] = useState([]);
	const [newArrivalProducts, setNewArrivalProducts] = useState([]);
	const [customDesignProducts, setCustomDesignProducts] = useState([]);
	const [loading, setLoading] = useState([]);

	const { websiteSetup } = useCartContext();

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Turn on loading
				setLoading(true);

				// (B) Categories & Subcategories
				const categoriesData = await gettingCategoriesAndSubcategories();
				if (categoriesData?.error) {
					console.log(categoriesData.error);
				} else {
					setCategories(categoriesData.categories || []);
					setSubcategories(categoriesData.subcategories || []);
				}

				// // (C) Featured Products => { featured:1, newArrivals:0, customDesigns:0, sortByRate:0, offers:0, records:5, skip=0 }
				const featuredData = await gettingSpecificProducts(1, 0, 0, 0, 0, 6);
				if (featuredData?.error) {
					console.log(featuredData.error);
				} else {
					// Sort by date descending
					const sortedFeatured = featuredData.sort(
						(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
					);

					setFeaturedProducts(sortedFeatured);
				}

				// // (D) New Arrival Products => { featured=0, newArrivals=1, ... }
				const newArrivalData = await gettingSpecificProducts(0, 1, 0, 0, 0, 6);
				if (newArrivalData?.error) {
					console.log(newArrivalData.error);
				} else {
					setNewArrivalProducts(newArrivalData);
				}

				// (E) Custom Design Products => { featured=0, newArrivals=0, customDesigns=1, ... }
				const customDesignData = await gettingSpecificProducts(
					0,
					0,
					1,
					0,
					0,
					6
				);
				if (customDesignData?.error) {
					console.log(customDesignData.error);
				} else {
					setCustomDesignProducts(customDesignData);
				}
			} catch (error) {
				console.error("Error fetching data in CartContext: ", error);
			} finally {
				// Turn off loading
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	// GA tracking for page:
	useEffect(() => {
		// Instead of ReactGA.send(...), do this:
		ReactGA.send({
			hitType: "pageview",
			page: window.location.pathname + window.location.search,
		});
		// If you prefer old .pageview approach in GA4, you can do:
		// ReactGA.pageview(window.location.pathname + window.location.search);
	}, []);

	// Scroll to top on mount
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	if (loading) {
		return (
			<HomeWrapper>
				<div className='loading-section'>
					<Spin indicator={loadingIcon} />
				</div>
			</HomeWrapper>
		);
	}

	return (
		<HomeWrapper>
			{/* Helmet / SEO */}
			<HomePageHelmet
				featuredProducts={featuredProducts}
				newArrivalProducts={newArrivalProducts}
				customDesignProducts={customDesignProducts}
			/>

			{/* Hero */}
			<Hero websiteSetup={websiteSetup} />

			{/* Categories */}
			{categories.length > 0 && (
				<FadeUpDiv>
					<ZCategories
						allCategories={categories}
						allSubcategories={subcategories}
					/>
				</FadeUpDiv>
			)}

			{/* Featured Products */}
			{featuredProducts.length > 0 && (
				<FadeUpDiv>
					<ZFeaturedProducts featuredProducts={featuredProducts} />
				</FadeUpDiv>
			)}

			{/* Custom Designs */}
			{customDesignProducts.length > 0 && (
				<FadeUpDiv>
					<ZCustomDesigns customDesignProducts={customDesignProducts} />
				</FadeUpDiv>
			)}

			{/* New Arrivals */}
			{newArrivalProducts.length > 0 && (
				<FadeUpDiv>
					<ZNewArrival newArrivalProducts={newArrivalProducts} />
				</FadeUpDiv>
			)}
		</HomeWrapper>
	);
};

export default Home;

/* Styled for the Home page */
const HomeWrapper = styled.div`
	width: 100%;
	.loading-section {
		min-height: 60vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}
`;
