import React from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";

/**
 * Utility: Capitalize words
 */
const capitalizeWords = (str) => {
	return str.replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Utility: Safely escape special JSON characters
 */
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

/**
 * Generate keywords based on your POD product array
 */
const generateKeywords = (products) => {
	// For example: gather productName, "POD", "Customize", etc.
	const podKeywords = ["Custom Gifts", "Print on Demand", "Personalized Gifts"];
	const productKeywords = products.map((p) => p.productName);
	return [...new Set([...podKeywords, ...productKeywords])].join(", ");
};

/**
 * Convert each Printify product to a structured data "Product" schema
 * so Google recognizes them as items you can customize / purchase.
 */
const generateProductSchema = (products) => {
	return products.map((product) => {
		const name = capitalizeWords(escapeJsonString(product.productName || ""));
		const description = escapeJsonString(
			(product.description || "").replace(/<[^>]+>/g, "")
		);
		// Basic fallback image
		const image = product.thumbnailImage?.[0]?.images?.[0]?.url || "";

		// Price logic: If multiple attributes, use the first's price or fallback
		const hasAttributes =
			product.productAttributes && product.productAttributes.length > 0;
		const price = hasAttributes
			? product.productAttributes?.[0]?.priceAfterDiscount ||
				product.priceAfterDiscount ||
				0
			: product.priceAfterDiscount || 0;

		// Summed quantity for "availability"
		const totalQty = hasAttributes
			? product.productAttributes.reduce(
					(acc, attr) => acc + (attr.quantity || 0),
					0
				)
			: product.quantity || 0;

		return {
			"@context": "http://schema.org",
			"@type": "Product",
			name,
			image,
			description,
			brand: {
				"@type": "Brand",
				name: "Serene Jannat",
			},
			mpn: product.productSKU, // or combine SKUs for variants
			offers: {
				"@type": "Offer",
				priceCurrency: "USD",
				price: Number(price).toFixed(2),
				priceValidUntil: "2026-12-31",
				availability:
					totalQty > 0
						? "http://schema.org/InStock"
						: "http://schema.org/OutOfStock",
				itemCondition: "http://schema.org/NewCondition",
			},
			// example: mark it as a special "Customizable / Print on Demand" item
			additionalProperty: [
				{
					"@type": "PropertyValue",
					name: "Customization",
					value: "Print-on-Demand Personalization",
				},
			],
			url: `https://serenejannat.com/custom-gifts/${product._id}`,
		};
	});
};

const PrintifyPageHelmet = ({ products }) => {
	const location = useLocation();

	const title = "Customize Your Gift | Print On Demand at Serene Jannat";
	const description =
		"Discover our Print on Demand products and customize your perfect gift at Serene Jannat. From mugs and shirts to bags, create a personalized present your loved ones will cherish.";
	const keywords = generateKeywords(products);
	const productSchema = generateProductSchema(products);

	// for canonical link
	const canonicalUrl = `https://serenejannat.com${location.pathname}${location.search}`;

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

			{/* Structured data for each product */}
			<script type='application/ld+json'>
				{JSON.stringify(productSchema)}
			</script>
		</Helmet>
	);
};

export default PrintifyPageHelmet;
