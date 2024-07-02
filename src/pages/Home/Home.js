import React, { useEffect, useState } from "react";
import styled from "styled-components";
import ReactGA from "react-ga4";
import { Helmet } from "react-helmet";
import Z1HeroComponent from "./Z1HeroComponent";
import ZSearch from "./Z2Search";
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
				gettingSpecificProducts(1, 0, 0, 0, 12).then((data2) => {
					if (data2 && data2.error) {
						console.log(data2.error);
					} else {
						setFeaturedProducts(data2);
						setAllCategories(data && data.categories);
						setAllSubcategories(data && data.subcategories);
					}
				});

				gettingSpecificProducts(0, 1, 0, 0, 8).then((data3) => {
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
		return products.map((product) => ({
			"@context": "http://schema.org",
			"@type": "Product",
			name: capitalizeWords(product.productName),
			image: product.thumbnailImage[0].images[0]?.url || "",
			description: product.description.replace(/<[^>]+>/g, ""),
			brand: {
				"@type": "Thing",
				name: product.category.categoryName,
			},
			offers: {
				"@type": "Offer",
				priceCurrency: "USD",
				price:
					product.priceAfterDiscount > 0
						? product.priceAfterDiscount
						: product.productAttributes[0].priceAfterDiscount,
				availability:
					product.productAttributes.reduce(
						(acc, attr) => acc + attr.quantity,
						0
					) > 0
						? "http://schema.org/InStock"
						: "http://schema.org/OutOfStock",
				itemCondition: "http://schema.org/NewCondition",
			},
			productID: product._id,
		}));
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
			<div className='pt-3'>
				<ZSearch />
			</div>
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
