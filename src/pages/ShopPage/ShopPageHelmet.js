import React from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";

// Utility function to capitalize the first letter of each word
const capitalizeWords = (str) => {
	return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

// Utility function to escape JSON strings
const escapeJsonString = (str) => {
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
			? product.productAttributes.reduce((acc, attr) => acc + attr.quantity, 0)
			: product.quantity;

		const priceValidUntil = "2026-12-31";

		const ratingValue =
			product.ratings.length > 0
				? (
						product.ratings.reduce((acc, rating) => acc + rating.star, 0) /
						product.ratings.length
					).toFixed(1)
				: "5.0";

		const reviewCount = product.ratings.length > 0 ? product.ratings.length : 1;

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
						reviewBody: escapeJsonString(comment.text),
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

		const mpn = hasVariables
			? product.productAttributes
					.map((attr) => `${product.productSKU}-${attr.SubSKU}`)
					.join(", ")
			: product.productSKU;

		return {
			"@context": "http://schema.org",
			"@type": "Product",
			name: capitalizeWords(product.productName),
			image: product.thumbnailImage[0]?.images[0]?.url || "",
			description: escapeJsonString(
				product.description.replace(/<[^>]+>/g, "")
			),
			brand: {
				"@type": "Brand",
				name: "Serene Jannat",
			},
			gtin: mpn,
			mpn,
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

const ShopPageHelmet = ({ products }) => {
	const location = useLocation(); // Use useLocation to get the current URL

	const title = "Our Products - Serene Jannat Gift Store";
	const description =
		"Explore our wide range of products including candles, glass items, and more at Serene Jannat Gift Store. Find the perfect gift for any occasion.";
	const keywords = generateKeywords(products);
	const productSchema = generateProductSchema(products);
	const canonicalUrl = `https://serenejannat.com${location.pathname}${location.search}`; // Generate canonical URL dynamically

	return (
		<Helmet>
			<title>{title}</title>
			<meta name='description' content={description} />
			<meta name='keywords' content={keywords} />
			<meta property='og:title' content={title} />
			<meta property='og:description' content={description} />
			<meta property='og:url' content={canonicalUrl} />
			<meta property='og:type' content='website' />
			<link rel='canonical' href={canonicalUrl} />
			<script type='application/ld+json'>
				{JSON.stringify(productSchema)}
			</script>
		</Helmet>
	);
};

export default ShopPageHelmet;
