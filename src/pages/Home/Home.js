import React, { useEffect, useState } from "react";
import styled from "styled-components";
import ReactGA from "react-ga4";
import { Helmet } from "react-helmet";
import Z1HeroComponent from "./Z1HeroComponent";
// import ZSearch from "./Z2Search";
import {
	gettingCategoriesAndSubcategories,
	gettingSpecificProducts,
} from "../../apiCore";
import ZCategories from "./ZCategories";
import AOS from "aos";
import "aos/dist/aos.css"; // Import AOS styles
import ZFeaturedProducts from "./ZFeaturedProducts";
import ZNewArrival from "./ZNewArrival";

const Home = () => {
	const [allCategories, setAllCategories] = useState("");
	const [allSubcategories, setAllSubcategories] = useState("");
	const [featuredProducts, setFeaturedProducts] = useState("");
	const [newArrivalProducts, setNewArrivalProducts] = useState("");
	const [loading, setLoading] = useState(true);

	const distinctCategoriesAndSubcategories = () => {
		setLoading(true);
		gettingCategoriesAndSubcategories().then((data) => {
			if (data && data.error) {
				console.log(data.error);
			} else {
				gettingSpecificProducts(1, 0, 0, 0, 20).then((data2) => {
					if (data2 && data2.error) {
						console.log(data2.error);
					} else {
						const sortedFeaturedProducts = data2.sort(
							(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
						);

						setFeaturedProducts(sortedFeaturedProducts);
						setAllCategories(data && data.categories);
						setAllSubcategories(data && data.subcategories);
					}
				});

				gettingSpecificProducts(0, 1, 0, 0, 10).then((data3) => {
					if (data3 && data3.error) {
						console.log(data3.error);
					} else {
						setNewArrivalProducts(data3);

						setLoading(false);
					}
				});
			}
		});
	};

	useEffect(() => {
		distinctCategoriesAndSubcategories();
		// eslint-disable-next-line
	}, []);

	useEffect(() => {
		ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_MEASUREMENTID);
		ReactGA.send(window.location.pathname + window.location.search);

		// eslint-disable-next-line
	}, [window.location.pathname]);

	useEffect(() => {
		AOS.init({ duration: 2000 }); // Initializes AOS; 1000 is the animation duration in milliseconds
		// Optionally, you can add settings for offset, delay, etc.
	}, []);

	// Utility function to capitalize the first letter of each word
	const capitalizeWords = (str) => {
		return str.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	// Generate keywords from products array
	const generateKeywords = (products) => {
		const categoryKeywords = products.map(
			(product) => product.category.categoryName
		);
		const productKeywords = products.map((product) => product.productName);
		return [...new Set([...categoryKeywords, ...productKeywords])].join(", ");
	};

	// Generate structured data for products
	const generateProductSchema = (products) => {
		return products.map((product) => {
			const hasVariables =
				product.productAttributes && product.productAttributes.length > 0;

			const price = hasVariables
				? product.productAttributes[0].priceAfterDiscount
				: product.priceAfterDiscount;

			const quantity = hasVariables
				? product.productAttributes.reduce(
						(acc, attr) => acc + attr.quantity,
						0
					)
				: product.quantity;

			const priceValidUntil = "2026-12-31";

			// Calculate ratingValue and reviewCount, defaulting to 5.0 and 1 if there are no ratings
			const ratingValue =
				product.ratings.length > 0
					? (
							product.ratings.reduce((acc, rating) => acc + rating.star, 0) /
							product.ratings.length
						).toFixed(1)
					: "5.0";

			const reviewCount =
				product.ratings.length > 0 ? product.ratings.length : 1;

			// Generate reviews, defaulting to one 5-star review if there are no comments
			const reviews =
				product.comments.length > 0
					? product.comments.map((comment) => ({
							"@type": "Review",
							reviewRating: {
								"@type": "Rating",
								ratingValue: comment.rating || 5, // Default to 5 if no rating provided
								bestRating: 5,
								worstRating: 1,
							},
							author: {
								"@type": "Person",
								name: comment.postedBy ? comment.postedBy.name : "Anonymous",
							},
							reviewBody: comment.text,
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

			return {
				"@context": "http://schema.org",
				"@type": "Product",
				name: capitalizeWords(product.productName),
				image: product.thumbnailImage[0].images[0]?.url || "",
				description: product.description.replace(/<[^>]+>/g, ""),
				brand: {
					"@type": "Brand",
					name: product.category.categoryName,
				},
				offers: {
					"@type": "Offer",
					priceCurrency: "USD",
					price: Number(price),
					priceValidUntil,
					availability:
						quantity > 0
							? "http://schema.org/InStock"
							: "http://schema.org/OutOfStock",
					itemCondition: "http://schema.org/NewCondition",
					hasMerchantReturnPolicy: {
						"@type": "MerchantReturnPolicy",
						returnPolicyCategory:
							"https://serenejannat.com/privacy-policy-terms-conditions",
						merchantReturnDays: "7",
						merchantReturnLink:
							"https://serenejannat.com/privacy-policy-terms-conditions",
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
				productID: product._id,
			};
		});
	};

	const HomePageHelmet = ({ featuredProducts, newArrivalProducts }) => {
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
					content={featuredProducts[0]?.thumbnailImage[0].images[0]?.url || ""}
				/>
				<meta property='og:url' content='https://serenejannat.com' />
				<meta property='og:type' content='website' />
				<script type='application/ld+json'>
					{JSON.stringify(productSchema)}
				</script>
			</Helmet>
		);
	};

	return (
		<HomeWrapper>
			<HomePageHelmet
				featuredProducts={featuredProducts}
				newArrivalProducts={newArrivalProducts}
			/>
			<div>
				<Z1HeroComponent />
			</div>
			{/* <div className='pt-3'>
				<ZSearch />
			</div> */}
			{!loading && allCategories && allCategories.length > 0 ? (
				<div data-aos='fade-down'>
					<ZCategories
						allCategories={allCategories}
						allSubcategories={allSubcategories}
					/>
				</div>
			) : null}
			{!loading && featuredProducts && featuredProducts.length > 0 ? (
				<div data-aos='fade-up'>
					<ZFeaturedProducts featuredProducts={featuredProducts} />
				</div>
			) : null}
			{!loading && newArrivalProducts && newArrivalProducts.length > 0 ? (
				<div data-aos='fade-up'>
					<ZNewArrival newArrivalProducts={newArrivalProducts} />
				</div>
			) : null}
		</HomeWrapper>
	);
};

export default Home;

const HomeWrapper = styled.div`
	min-height: 2000px;
	overflow: hidden;
`;
