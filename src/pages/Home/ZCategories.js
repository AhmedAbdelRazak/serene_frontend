import React, { useCallback } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Card } from "antd";
import ReactGA from "react-ga4";
import ReactPixel from "react-facebook-pixel";

/**
 * Helper to insert Cloudinary transformations:
 *   - f_auto,q_auto,w_{width}
 *   - optionally f_webp for forceWebP
 *
 * e.g.:
 *   https://res.cloudinary.com/.../upload/f_auto,q_auto,w_600/...
 */
const getCloudinaryOptimizedUrl = (
	url,
	{ width = 600, forceWebP = false } = {}
) => {
	if (!url || !url.includes("res.cloudinary.com")) {
		return url; // Not a Cloudinary URL
	}

	// If the URL already has 'f_auto' or 'q_auto'
	// we still ensure "w_..." is added if not present
	let newUrl = url;
	// Check if transformations already exist:
	const hasTransform = newUrl.includes("f_auto") || newUrl.includes("q_auto");

	if (!hasTransform) {
		// Insert transformations after '/upload/'
		const parts = newUrl.split("/upload/");
		if (parts.length === 2) {
			// e.g. ".../upload/f_auto,q_auto,w_600/..."
			const transform = `f_auto,q_auto,w_${width}`;
			const finalTransform = forceWebP ? `${transform},f_webp` : transform;
			newUrl = `${parts[0]}/upload/${finalTransform}/${parts[1]}`;
		}
	} else {
		// If transformations exist, ensure 'w_{width}' is present
		if (!newUrl.match(/w_\d+/)) {
			// Insert 'w_{width}' after 'f_auto,q_auto'
			// or append if there's no w_
			newUrl = newUrl.replace("f_auto,q_auto", `f_auto,q_auto,w_${width}`);
			if (forceWebP && !newUrl.includes("f_webp")) {
				newUrl = newUrl.replace("f_auto,q_auto", "f_auto,q_auto,f_webp");
			}
		}
	}

	return newUrl;
};

const ZCategories = ({ allCategories }) => {
	// Memoize the click handler
	const handleCategoryClick = useCallback((categoryName) => {
		ReactGA.event({
			category: "Category Clicked Home Page",
			action: "User Clicked On Category In Home Page",
			label: `User Clicked on ${categoryName} In The Home Page`,
		});

		ReactPixel.track("Lead", {
			content_name: `User Clicked on ${categoryName} In The Home Page`,
			click_type: "Category Clicked",
			// You can add more parameters if you want
			// e.g. currency: "USD", value: 0
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

					// If there's a thumbnail, generate multiple Cloudinary URLs
					let imageUrl = "";
					let webpUrl = "";
					if (category.thumbnail && category.thumbnail.length > 0) {
						const originalUrl = category.thumbnail[0].url;

						// Base (JPEG/PNG/etc.) - forcing width=600 by default
						const baseJpg = getCloudinaryOptimizedUrl(originalUrl, {
							width: 600,
							forceWebP: false,
						});
						// WebP version
						const baseWebp = getCloudinaryOptimizedUrl(originalUrl, {
							width: 600,
							forceWebP: true,
						});

						// Now let's do *responsive* widths via string replace:
						// e.g. w_600 => w_480 or w_768 or w_1200
						const jpg480 = baseJpg.replace("w_600", "w_480");
						const jpg768 = baseJpg.replace("w_600", "w_768");
						const jpg1200 = baseJpg.replace("w_600", "w_1200");

						const webp480 = baseWebp.replace("w_600", "w_480");
						const webp768 = baseWebp.replace("w_600", "w_768");
						const webp1200 = baseWebp.replace("w_600", "w_1200");

						// We'll pass these to <source> and <img> so the browser picks the best size
						imageUrl = {
							fallback: jpg480, // smallest fallback if older browser doesn't handle srcset
							srcset: `${jpg480} 480w,
                       ${jpg768} 768w,
                       ${jpg1200} 1200w,
                       ${baseJpg} 1600w`,
						};

						webpUrl = {
							fallback: webp480, // smallest
							srcset: `${webp480} 480w,
                       ${webp768} 768w,
                       ${webp1200} 1200w,
                       ${baseWebp} 1600w`,
						};
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
                      Use <picture> with multiple <source> tags to serve WebP if supported,
                      with responsive widths. The fallback <img> is for older browsers.
                    */}
										<picture>
											<source
												type='image/webp'
												srcSet={webpUrl.srcset}
												sizes='(max-width: 480px) 480px,
                               (max-width: 768px) 768px,
                               (max-width: 1200px) 1200px,
                               1600px'
											/>
											<source
												type='image/jpeg'
												srcSet={imageUrl.srcset}
												sizes='(max-width: 480px) 480px,
                               (max-width: 768px) 768px,
                               (max-width: 1200px) 1200px,
                               1600px'
											/>

											<CategoryImage
												loading='lazy'
												src={imageUrl.fallback}
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
(Styling remains exactly the same as before)
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
