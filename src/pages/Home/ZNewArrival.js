import React, { useMemo, useCallback } from "react";
import styled from "styled-components";
import Slider from "react-slick";
import { Card } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useCartContext } from "../../cart_context";
import { readProduct } from "../../apiCore";
import { useHistory } from "react-router-dom";
import ReactGA from "react-ga4";

const { Meta } = Card;

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

const ZNewArrival = ({ newArrivalProducts }) => {
	const { openSidebar2, addToCart } = useCartContext();
	const history = useHistory();

	// Main slider settings for the outer "New Arrivals" carousel
	const settings = useMemo(
		() => ({
			dots: true,
			infinite: true,
			speed: 2000,
			slidesToShow: 5,
			slidesToScroll: 1,
			autoplay: true,
			autoplaySpeed: 5000,
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
		}),
		[]
	);

	// Add-to-cart handler (memoized)
	const handleCartIconClick = useCallback(
		async (product, e) => {
			e.stopPropagation();
			// If it's a POD product, redirect to the custom gifts page.
			if (product.isPrintifyProduct && product.printifyProductDetails?.POD) {
				history.push(`/custom-gifts/${product._id}`);
				return;
			}
			ReactGA.event({
				category: "Add To The Cart New Arrivals",
				action: "User Added New Arrival Product To The Cart",
				label: `User added ${product.productName} to the cart from New Arrivals`,
			});
			try {
				const data3 = await readProduct(product._id);
				if (data3 && !data3.error) {
					openSidebar2();
					addToCart(product._id, null, 1, data3, product.productAttributes[0]);
				}
			} catch (error) {
				console.error(error);
			}
		},
		[history, openSidebar2, addToCart]
	);

	// Navigation handler (memoized)
	const navigateToProduct = useCallback(
		(product) => {
			// If it's a POD product, redirect accordingly.
			if (product.isPrintifyProduct && product.printifyProductDetails?.POD) {
				history.push(`/custom-gifts/${product._id}`);
				return;
			}
			ReactGA.event({
				category: "New Arrival Product Clicked",
				action: "New Arrival Product Clicked",
				label: `User Navigated to ${product.productName} single page`,
			});
			window.scrollTo({ top: 0, behavior: "smooth" });
			history.push(
				`/single-product/${product.slug}/${product.category.categorySlug}/${product._id}`
			);
		},
		[history]
	);

	return (
		<Container>
			<ZNewArrivalWrapper>
				<h2>New Arrivals</h2>
				<Slider {...settings}>
					{newArrivalProducts &&
						newArrivalProducts.map((product, i) => {
							const chosenProductAttributes = product.productAttributes[0];
							const images =
								chosenProductAttributes?.productImages ||
								product.thumbnailImage[0].images;

							// Always just take the first image
							const firstImage = images[0];

							// Get optimized URLs (similar to ZCategories)
							let imageUrl = "";
							let webpUrl = "";
							if (firstImage?.url) {
								const originalUrl = firstImage.url;
								imageUrl = getCloudinaryOptimizedUrl(originalUrl, {
									width: 600,
									forceWebP: false,
								});
								webpUrl = getCloudinaryOptimizedUrl(originalUrl, {
									width: 600,
									forceWebP: true,
								});
							}

							const originalPrice = product.price || 0;
							const discountedPrice =
								product.priceAfterDiscount > 0
									? product.priceAfterDiscount
									: chosenProductAttributes?.priceAfterDiscount || 0;

							const originalPriceFixed = originalPrice.toFixed(2);
							const discountedPriceFixed = discountedPrice.toFixed(2);

							const totalQuantity =
								product.productAttributes.reduce(
									(acc, attr) => acc + attr.quantity,
									0
								) || product.quantity;

							// Check if the product is POD.
							const isPOD =
								product.isPrintifyProduct &&
								product.printifyProductDetails?.POD;

							return (
								<div key={i} className='slide'>
									<ProductCard
										hoverable
										onClick={() => navigateToProduct(product)}
										cover={
											<ImageContainer>
												{/* If it's a POD product, show the custom design badge */}
												{isPOD && <PodBadge>Custom Design 💖</PodBadge>}

												{totalQuantity > 0 ? (
													<CartIcon
														onClick={(e) => handleCartIconClick(product, e)}
													/>
												) : (
													<OutOfStockBadge>Out of Stock</OutOfStockBadge>
												)}

												<ImageWrapper>
													<picture>
														<source srcSet={webpUrl} type='image/webp' />
														<ProductImage
															src={imageUrl}
															alt={`${product.productName} - single view`}
															loading='lazy'
														/>
													</picture>
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
			</ZNewArrivalWrapper>
		</Container>
	);
};

export default ZNewArrival;

/* ==== STYLES ==== */
const Container = styled.div`
	background: var(--background-light);
	padding: 10px;
	border-radius: 5px;
	margin-top: 50px;
	margin-bottom: 50px;
`;

const ZNewArrivalWrapper = styled.div`
	max-width: 1400px;
	margin: auto;

	h2 {
		font-weight: bold;
		text-align: center;
		margin-bottom: 40px;
		color: var(--text-color-dark);
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

const CartIcon = styled(ShoppingCartOutlined)`
	position: absolute;
	top: 20px;
	right: 20px;
	font-size: 24px;
	color: var(--neutral-light);
	background-color: rgba(0, 0, 0, 0.5);
	border-radius: 50%;
	padding: 3px;
	cursor: pointer;
	z-index: 10;

	&:hover {
		color: var(--secondary-color-dark);
	}
`;

const OutOfStockBadge = styled.div`
	position: absolute;
	top: 10px;
	right: 10px;
	font-size: 13px;
	color: grey;
	background-color: #ffc6c6;
	border-radius: 5px;
	padding: 5px 10px;
	z-index: 10;
	font-style: italic;
	font-weight: bold;
`;

const OriginalPrice = styled.span`
	color: var(--secondary-color);
	text-decoration: line-through;
	margin-right: 8px;
`;

const DiscountedPrice = styled.span`
	color: var(--text-color-primary);
`;
