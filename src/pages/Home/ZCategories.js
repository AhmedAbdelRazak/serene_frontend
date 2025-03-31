import React, { useCallback } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Card } from "antd";
import ReactGA from "react-ga4";

// 1) Cloudinary Transform Helper
//    If the URL isn't Cloudinary, returns original.
//    Otherwise, inserts f_auto,q_auto,w_{width} + optional f_webp.
const getCloudinaryOptimizedUrl = (
	url,
	{ width = 600, forceWebP = false } = {}
) => {
	if (!url || !url.includes("res.cloudinary.com")) {
		return url; // Not a Cloudinary URL
	}

	// If we've already inserted something like f_auto,q_auto, skip
	if (url.includes("f_auto") || url.includes("q_auto")) {
		return url;
	}

	// Split at '/upload/' to insert transformations
	const parts = url.split("/upload/");
	if (parts.length !== 2) {
		return url; // Can't parse, return original
	}

	// Build transformation string
	// Example: f_auto,q_auto,w_600 or f_auto,q_auto,w_600,f_webp
	const baseTransform = `f_auto,q_auto,w_${width}`;
	const finalTransform = forceWebP ? `${baseTransform},f_webp` : baseTransform;

	// Reconstruct URL
	// e.g. https://res.cloudinary.com/.../upload/f_auto,q_auto,w_600/...
	return `${parts[0]}/upload/${finalTransform}/${parts[1]}`;
};

const ZCategories = ({ allCategories }) => {
	// Memoize the click handler
	const handleCategoryClick = useCallback((categoryName) => {
		ReactGA.event({
			category: "Category Clicked Home Page",
			action: "User Clicked On Category In Home Page",
			label: `User Clicked on ${categoryName} In The Home Page`,
		});
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	return (
		<Container>
			<ZCategoriesWrapper>
				{allCategories.map((category) => {
					// Determine the target URL based on the category's id
					const linkTarget =
						category._id === "679bb2a7dba50a58933d01eb"
							? "/custom-gifts"
							: `/our-products?category=${category.categorySlug}`;

					// If there's a thumbnail, generate optimized URLs
					let imageUrl = "";
					let webpUrl = "";
					if (category.thumbnail && category.thumbnail.length > 0) {
						const originalUrl = category.thumbnail[0].url;
						// Normal (any next-gen auto) version
						imageUrl = getCloudinaryOptimizedUrl(originalUrl, {
							width: 600,
							forceWebP: false,
						});
						// Explicit WebP version
						webpUrl = getCloudinaryOptimizedUrl(originalUrl, {
							width: 600,
							forceWebP: true,
						});
					}

					return (
						<CategoryCard
							key={category.categorySlug}
							onClick={() => handleCategoryClick(category.categoryName)}
						>
							<Link to={linkTarget}>
								{imageUrl && (
									<CategoryImageWrapper>
										{/* 
                      Use <picture> to serve WebP if supported,
                      then fallback to the normal image
                    */}
										<picture>
											<source srcSet={webpUrl} type='image/webp' />
											<CategoryImage
												loading='lazy'
												src={imageUrl}
												alt={category.categoryName}
											/>
										</picture>
									</CategoryImageWrapper>
								)}
								<CategoryName>{category.categoryName}</CategoryName>
							</Link>
						</CategoryCard>
					);
				})}
			</ZCategoriesWrapper>
		</Container>
	);
};

export default React.memo(ZCategories);

/* 
  ================ 
  STYLED COMPONENTS 
  ================ 
  (Unchanged from your example)
*/

const Container = styled.div`
	background: var(--neutral-light);
	padding: 10px;
	border-radius: 5px;
	margin-top: 50px;
	margin-bottom: 50px;
	display: flex;
	justify-content: center;
	align-items: center;
`;

const ZCategoriesWrapper = styled.div`
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 20px;
	width: 100%;
	max-width: 1200px;
	padding: 20px;
	margin: auto;

	@media (max-width: 480px) {
		gap: 10px;
		padding: 5px;
	}

	.ant-card-body {
		padding: 0 !important; /* Remove padding from the card body */
	}
`;

const CategoryCard = styled(Card)`
	border-radius: 10px;
	overflow: hidden;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	transition:
		transform 0.3s ease,
		box-shadow 0.3s ease;
	padding: 0 !important; /* Remove padding from the card */
	flex: 1 1 18%; /* Adjust the size of the cards */

	&:hover {
		transform: translateY(-10px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
	}

	@media (max-width: 1024px) {
		flex: 1 1 28%;
	}

	@media (max-width: 768px) {
		flex: 1 1 45%;
	}

	@media (max-width: 480px) {
		flex: 1 1 calc(50% - 7px); /* Ensure 2 cards per row with 7px gap */
	}
`;

const CategoryImageWrapper = styled.div`
	width: 100%;
	height: 170px;
	overflow: hidden;
	border-radius: 10px 10px 0 0;
	display: flex;
	justify-content: center;
	align-items: center;
`;

const CategoryImage = styled.img`
	width: 100%;
	height: 100%;
	object-fit: cover;
	object-position: center;
`;

const CategoryName = styled.h3`
	text-align: center;
	margin: 0;
	padding: 10px 0;
	color: var(--text-color-dark);
	font-size: 16px;
	text-transform: capitalize;
	font-weight: bolder;
	cursor: pointer;

	&:hover {
		color: var(--secondary-color);
		text-decoration: underline;
	}

	@media (max-width: 1024px) {
		font-size: 14px;
	}
	@media (max-width: 768px) {
		font-size: 14px;
	}
	@media (max-width: 480px) {
		font-size: 14px;
	}
`;
