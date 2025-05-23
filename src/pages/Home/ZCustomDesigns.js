import React, { useMemo, useCallback, useState } from "react";
import styled from "styled-components";
import Slider from "react-slick";
import { Card } from "antd";
import { useHistory } from "react-router-dom";
import ReactGA from "react-ga4";
import { gettingSpecificProducts } from "../../apiCore";
import ReactPixel from "react-facebook-pixel";

const { Meta } = Card;

/**
 * (1) Cloudinary Transform Helper
 * If the URL isn't Cloudinary, returns original.
 * Otherwise, inserts f_auto,q_auto,w_{width} + optional f_webp.
 */
const getCloudinaryOptimizedUrl = (
	url,
	{ width = 600, forceWebP = false } = {}
) => {
	if (!url || !url.includes("res.cloudinary.com")) {
		return url; // Not a Cloudinary URL
	}

	let newUrl = url;
	const hasTransform = newUrl.includes("f_auto") || newUrl.includes("q_auto");

	if (!hasTransform) {
		const parts = newUrl.split("/upload/");
		if (parts.length === 2) {
			const baseTransform = `f_auto,q_auto,w_${width}`;
			const finalTransform = forceWebP
				? `${baseTransform},f_webp`
				: baseTransform;
			newUrl = `${parts[0]}/upload/${finalTransform}/${parts[1]}`;
		}
	} else {
		// If transformations exist, ensure 'w_{width}' is present
		if (!newUrl.match(/w_\d+/)) {
			newUrl = newUrl.replace("f_auto,q_auto", `f_auto,q_auto,w_${width}`);
			if (forceWebP && !newUrl.includes("f_webp")) {
				newUrl = newUrl.replace("f_auto,q_auto", "f_auto,q_auto,f_webp");
			}
		}
	}

	return newUrl;
};

const MAX_PRODUCTS = 15;

const ZCustomDesigns = ({ customDesignProducts }) => {
	const history = useHistory();

	// -----------------------------
	// 1) Local state for lazy-load
	// -----------------------------
	const [designList, setDesignList] = useState(customDesignProducts || []);
	const [skip, setSkip] = useState(designList.length);
	const [loadingOne, setLoadingOne] = useState(false);
	const hasMore = designList.length < MAX_PRODUCTS;

	// Function to fetch exactly ONE more custom design
	const fetchOneMoreDesign = useCallback(async () => {
		if (!hasMore || loadingOne) return;
		setLoadingOne(true);

		try {
			// customDesigns=1 => (featured=0, newArrivals=0, customDesigns=1)
			// records=1 => skip=skip
			const data = await gettingSpecificProducts(0, 0, 1, 0, 0, 1, skip);
			if (data && !data.error) {
				if (data.length > 0) {
					setDesignList((prev) => [...prev, ...data]);
					setSkip(skip + data.length);
				}
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoadingOne(false);
		}
	}, [skip, hasMore, loadingOne]);

	// -----------------------------
	// 2) Main slider settings
	// -----------------------------
	const settings = useMemo(
		() => ({
			dots: true,
			infinite: true,
			speed: 300,
			slidesToShow: 5,
			slidesToScroll: 1,
			autoplay: false,
			autoplaySpeed: 7000,
			centerMode: true,
			centerPadding: "60px",
			responsive: [
				{
					breakpoint: 1024,
					settings: {
						slidesToShow: 3,
						slidesToScroll: 1,
						infinite: true,
						dots: true,
					},
				},
				{
					breakpoint: 600,
					settings: {
						slidesToShow: 2,
						slidesToScroll: 1,
						centerPadding: "30px",
					},
				},
				{
					breakpoint: 480,
					settings: {
						slidesToShow: 1,
						slidesToScroll: 1,
						centerPadding: "25px",
					},
				},
			],
			afterChange: (currentSlide) => {
				// If near the end, fetch one more
				if (!hasMore || loadingOne) return;
				if (currentSlide > designList.length - 6) {
					fetchOneMoreDesign();
				}
			},
		}),
		[hasMore, loadingOne, designList.length, fetchOneMoreDesign]
	);

	// -----------------------------
	// 3) Handlers
	// -----------------------------
	const navigateToProduct = useCallback(
		(product) => {
			// If it's a POD product, redirect to custom gifts page
			if (product.isPrintifyProduct && product.printifyProductDetails?.POD) {
				ReactGA.event({
					category: "Custom Design Product Clicked",
					action: "Custom Design Clicked",
					label: `User Custom Design ${product.productName} single page`,
				});

				ReactPixel.track("Lead", {
					content_name: `User Navigated to ${product.productName} single page`,
					click_type: "Print On Demand Clicked",
					// You can add more parameters if you want
					// e.g. currency: "USD", value: 0
				});

				history.push(`/custom-gifts/${product._id}`);
				return;
			}

			window.scrollTo({ top: 0, behavior: "smooth" });
			history.push(
				`/single-product/${product.slug}/${product.category.categorySlug}/${product._id}`
			);
		},
		[history]
	);

	// -----------------------------
	// 4) Render
	// -----------------------------
	return (
		<Container>
			<ZCustomDesignsWrapper>
				<h2>
					Welcome to our <strong className='mx-1'>PRINT ON DEMAND</strong>{" "}
					Section. Upload an image of a cherished memory for your loved ones in
					just seconds!
				</h2>

				<Slider {...settings}>
					{designList.map((product, i) => {
						const chosenProductAttributes = product.productAttributes[0];

						// eslint-disable-next-line
						const images =
							chosenProductAttributes?.productImages ||
							product.thumbnailImage[0].images;

						// Always just take the first image
						const firstImage = chosenProductAttributes?.exampleDesignImage;

						const originalPrice = product.price || 0;
						const discountedPrice =
							product.priceAfterDiscount > 0
								? product.priceAfterDiscount
								: chosenProductAttributes?.priceAfterDiscount || 0;

						const originalPriceFixed = originalPrice.toFixed(2);
						const discountedPriceFixed = discountedPrice.toFixed(2);

						// Is it a Printify On-Demand product
						const isPOD =
							product.isPrintifyProduct && product.printifyProductDetails?.POD;

						// Create optimized URLs for the single first image
						let baseJpg = "";
						let baseWebp = "";

						if (firstImage?.url) {
							baseJpg = getCloudinaryOptimizedUrl(firstImage.url, {
								width: 600,
								forceWebP: false,
							});
							baseWebp = getCloudinaryOptimizedUrl(firstImage.url, {
								width: 600,
								forceWebP: true,
							});
						}

						return (
							<div key={i} className='slide'>
								<ProductCard
									hoverable
									onClick={() => navigateToProduct(product)}
									cover={
										<ImageContainer>
											{/* If it's a POD product, show the custom design badge */}
											{isPOD && <PodBadge>Custom Design 💖</PodBadge>}

											<ImageWrapper>
												{baseJpg ? (
													<picture>
														<source srcSet={baseWebp} type='image/webp' />
														<ProductImage
															src={baseJpg}
															alt={`${product.productName} - single view`}
															loading='lazy'
														/>
													</picture>
												) : (
													<NoImagePlaceholder>No Image</NoImagePlaceholder>
												)}
											</ImageWrapper>
										</ImageContainer>
									}
								>
									<Meta
										title={product.productName}
										description={
											originalPrice > discountedPrice ? (
												<span>
													Price:{" "}
													<OriginalPrice>${originalPriceFixed}</OriginalPrice>{" "}
													<DiscountedPrice>
														${discountedPriceFixed}
													</DiscountedPrice>
												</span>
											) : (
												<DiscountedPrice>
													Price: ${discountedPriceFixed}
												</DiscountedPrice>
											)
										}
									/>
								</ProductCard>
							</div>
						);
					})}
				</Slider>
			</ZCustomDesignsWrapper>
		</Container>
	);
};

export default ZCustomDesigns;

/* 
  === STYLES ===
  (Keeping your existing styles intact)
  */

const Container = styled.div`
	background: var(--background-light);
	padding: 10px;
	border-radius: 5px;
	margin-top: 50px;
	margin-bottom: 50px;

	@media (max-width: 900px) {
		padding: 5px;
	}
`;

const ZCustomDesignsWrapper = styled.div`
	max-width: 1400px;
	margin: auto;

	h2 {
		strong {
			font-weight: bold !important;
			color: darkgoldenrod !important;
			font-style: italic !important;
			text-decoration: underline;
		}
		font-weight: bold;
		text-align: center;
		margin-bottom: 40px;
		color: var(--text-color-dark);
		color: var(--secondary-color-darker);
		font-size: 1.35rem;
		margin-top: 5px;
		margin-bottom: 5px;
		font-weight: bold;
		line-height: 1;
		text-align: left;
	}

	.slick-slide {
		padding: 10px;
		box-sizing: border-box;
	}

	.slick-dots {
		bottom: -30px;
	}

	.slick-prev:before,
	.slick-next:before {
		color: var(--text-color-dark);
	}

	.slick-dots li button:before {
		color: var(--text-color-dark);
	}

	.slick-dots {
		display: none !important;
	}

	@media (max-width: 900px) {
		.slick-arrow,
		.slick-prev {
			display: none !important;
		}

		h2 {
			font-size: 1.1rem;
			margin-top: 5px;
			margin-bottom: 5px;
			padding: 10px;
		}
	}
`;

const ProductCard = styled(Card)`
	border-radius: 10px;
	overflow: hidden;
	box-shadow: var(--box-shadow-light);
	transition:
		transform 0.3s ease,
		box-shadow 0.3s ease;
	text-align: center;
	position: relative;
	text-transform: capitalize;
	max-height: 400px;
	min-height: 400px;

	@media (max-width: 700px) {
		max-height: 500px;
		min-height: 500px;
	}

	&:hover {
		transform: translateY(-10px);
		box-shadow: var(--box-shadow-dark);
	}

	.ant-card-cover {
		margin: -16px -16px 0 -16px;
	}

	.ant-card-body {
		padding: 5px !important;
	}
`;

const ImageContainer = styled.div`
	position: relative;
`;

const ImageWrapper = styled.div`
	width: 100%;
	height: 300px;
	overflow: hidden;
	border-radius: 10px 10px 0 0;

	@media (max-width: 700px) {
		height: 400px;
	}
`;

const ProductImage = styled.img`
	width: 100%;
	height: 100%;
	object-fit: cover;
	object-position: center;
`;

const NoImagePlaceholder = styled.div`
	width: 100%;
	height: 100%;
	background: #ccc;
	display: flex;
	align-items: center;
	justify-content: center;
	font-weight: bold;
`;

const PodBadge = styled.div`
	position: absolute;
	top: 12px;
	left: 12px;
	background-color: #ffafc5;
	color: #ffffff;
	padding: 4px 8px;
	border-radius: 4px;
	font-weight: bold;
	font-size: 0.8rem;
	z-index: 20;
	box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
`;

const OriginalPrice = styled.span`
	color: var(--secondary-color);
	text-decoration: line-through;
	margin-right: 8px;
`;

const DiscountedPrice = styled.span`
	color: var(--text-color-primary);
`;
