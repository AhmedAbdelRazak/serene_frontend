import React, { useEffect, useState } from "react";
import styled from "styled-components";
import ReactGA from "react-ga4";
import { Helmet } from "react-helmet";
import Z1HeroComponent from "./Z1HeroComponent";
import {
	gettingCategoriesAndSubcategories,
	gettingSpecificProducts,
} from "../../apiCore";
import ZCategories from "./ZCategories";
import AOS from "aos";
import "aos/dist/aos.css"; // Import AOS styles
import ZFeaturedProducts from "./ZFeaturedProducts";
import ZNewArrival from "./ZNewArrival";
import ZCustomDesigns from "./ZCustomDesigns";

const Home = () => {
	const [allCategories, setAllCategories] = useState([]);
	const [allSubcategories, setAllSubcategories] = useState([]);
	const [featuredProducts, setFeaturedProducts] = useState([]);
	const [newArrivalProducts, setNewArrivalProducts] = useState([]);
	const [customDesignProducts, setCustomDesignProducts] = useState([]);
	const [loading, setLoading] = useState(true);

	const distinctCategoriesAndSubcategories = () => {
		setLoading(true);
		gettingCategoriesAndSubcategories().then((data) => {
			if (data?.error) {
				console.log(data.error);
				setLoading(false);
			} else {
				gettingSpecificProducts(1, 0, 0, 0, 0, 20).then((data2) => {
					if (data2?.error) {
						console.log(data2.error);
					} else {
						const sortedFeaturedProducts = data2.sort(
							(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
						);
						setFeaturedProducts(sortedFeaturedProducts);
						setAllCategories(data.categories || []);
						setAllSubcategories(data.subcategories || []);
					}
				});

				gettingSpecificProducts(0, 1, 0, 0, 0, 20).then((data3) => {
					if (data3?.error) {
						console.log(data3.error);
					} else {
						setNewArrivalProducts(data3 || []);

						gettingSpecificProducts(0, 0, 1, 0, 0, 20).then((data4) => {
							if (data4?.error) {
								console.log(data4.error);
							} else {
								setCustomDesignProducts(data4 || []);
							}
						});

						setLoading(false);
					}
				});
			}
		});
	};

	useEffect(() => {
		distinctCategoriesAndSubcategories();
		window.scrollTo({ top: 0, behavior: "smooth" });
		// eslint-disable-next-line
	}, []);

	useEffect(() => {
		ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_MEASUREMENTID);
		ReactGA.send(window.location.pathname + window.location.search);
		// eslint-disable-next-line
	}, [window.location.pathname]);

	useEffect(() => {
		// Initializes AOS; 2000 is the animation duration in milliseconds
		AOS.init({ duration: 2000 });
	}, []);

	// Utility function to capitalize the first letter of each word
	const capitalizeWords = (str = "") => {
		return str.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	// Utility function to escape JSON strings
	const escapeJsonString = (str = "") => {
		// Provide a default empty string to avoid `.replace` errors
		return str
			.replace(/\\/g, "\\\\")
			.replace(/"/g, '\\"')
			.replace(/\n/g, "\\n")
			.replace(/\r/g, "\\r")
			.replace(/\t/g, "\\t")
			.replace(/\b/g, "\\b")
			.replace(/\f/g, "\\f");
	};

	// (Optional) Utility function to format the GTIN
	// eslint-disable-next-line
	const formatGTIN = (sku = "") => {
		let formattedSKU = sku.toString().replace(/[^0-9]/g, "");
		if (formattedSKU.length > 14) {
			formattedSKU = formattedSKU.substring(0, 14);
		} else if (formattedSKU.length < 14) {
			while (formattedSKU.length < 14) {
				formattedSKU += "0"; // Pad with zeros
			}
		}
		return formattedSKU;
	};

	// Generate keywords from products array
	const generateKeywords = (products = []) => {
		const categoryKeywords = products.map(
			(product) => product?.category?.categoryName || ""
		);
		const productKeywords = products.map(
			(product) => product?.productName || ""
		);
		return [...new Set([...categoryKeywords, ...productKeywords])].join(", ");
	};

	// Generate structured data for products
	const generateProductSchema = (products = []) => {
		return products.map((product) => {
			// Defensive checks
			const hasVariables =
				product?.productAttributes && product.productAttributes.length > 0;

			const price = hasVariables
				? product.productAttributes[0].priceAfterDiscount
				: product?.priceAfterDiscount || 0;

			const quantity = hasVariables
				? product.productAttributes.reduce(
						(acc, attr) => acc + attr.quantity,
						0
					)
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
					// Remove any HTML tags if product.description exists
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

			// If you want to add GTIN checking logic:
			// if (product.productSKU && /\d/.test(product.productSKU)) {
			//   productSchema.gtin = formatGTIN(product.productSKU);
			// } else {
			//   productSchema.identifier_exists = false;
			// }
			// For safety:
			productSchema.identifier_exists = false;

			return productSchema;
		});
	};

	const HomePageHelmet = ({
		featuredProducts = [],
		newArrivalProducts = [],
	}) => {
		const title = "Serene Jannat | Best Gifts and Candles Online Shop";
		const description =
			"Discover the best offers at Serene Jannat, your online gift store for candles, glass items, and more. Show love to your loved ones with our exquisite collection.";
		const keywords = generateKeywords([
			...featuredProducts,
			...newArrivalProducts,
		]);
		const productSchema = generateProductSchema([
			...featuredProducts,
			...newArrivalProducts,
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

	return (
		<HomeWrapper>
			{/* Helmet / SEO */}
			<HomePageHelmet
				featuredProducts={featuredProducts}
				newArrivalProducts={newArrivalProducts}
			/>

			<div>
				<Z1HeroComponent />
			</div>

			{/* Categories */}
			{!loading && allCategories.length > 0 && (
				<ZCategories
					allCategories={allCategories}
					allSubcategories={allSubcategories}
				/>
			)}

			{/* Custom Designs */}
			{!loading && customDesignProducts.length > 0 && (
				<div data-aos='fade-up'>
					<ZCustomDesigns customDesignProducts={customDesignProducts} />
				</div>
			)}

			{/* Featured Products */}
			{!loading && featuredProducts.length > 0 && (
				<div data-aos='fade-up'>
					<ZFeaturedProducts featuredProducts={featuredProducts} />
				</div>
			)}

			{/* New Arrivals */}
			{!loading && newArrivalProducts.length > 0 && (
				<div data-aos='fade-up'>
					<ZNewArrival newArrivalProducts={newArrivalProducts} />
				</div>
			)}
		</HomeWrapper>
	);
};

export default Home;

const HomeWrapper = styled.div`
	min-height: 2000px;
	overflow: hidden;
`;
