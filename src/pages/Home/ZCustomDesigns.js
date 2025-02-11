import React, { useMemo, useCallback } from "react";
import styled from "styled-components";
import Slider from "react-slick";
import { Card } from "antd";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useHistory } from "react-router-dom";
import ReactGA from "react-ga4";

const { Meta } = Card;

const ZCustomDesigns = ({ customDesignProducts }) => {
	const history = useHistory();

	// Memoize main slider settings so they're computed only once.
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

	// Memoize the inner image slider settings.
	const imageSettings = useMemo(
		() => ({
			dots: true,
			infinite: true,
			speed: 1500,
			slidesToShow: 1,
			slidesToScroll: 1,
			autoplay: true,
			autoplaySpeed: 4000,
		}),
		[]
	);

	// Memoize the add-to-cart handler.

	// Memoize the navigation handler.
	const navigateToProduct = useCallback(
		(product) => {
			// If it's a POD product, redirect accordingly.
			if (product.isPrintifyProduct && product.printifyProductDetails?.POD) {
				ReactGA.event({
					category: "Custom Design Product Clicked",
					action: "Custom Design Clicked",
					label: `User Custom Design ${product.productName} single page`,
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

	return (
		<Container>
			<ZCustomDesignsWrapper>
				<h2>
					Create a keepsake they’ll treasure. Personalize any item with your
					special words or favorite picture.
				</h2>
				<Slider {...settings}>
					{customDesignProducts &&
						customDesignProducts.map((product, i) => {
							const chosenProductAttributes = product.productAttributes[0];
							const images =
								chosenProductAttributes?.productImages ||
								product.thumbnailImage[0].images;

							const originalPrice = product.price || 0;
							const discountedPrice =
								product.priceAfterDiscount > 0
									? product.priceAfterDiscount
									: chosenProductAttributes?.priceAfterDiscount || 0;

							const originalPriceFixed = originalPrice.toFixed(2);
							const discountedPriceFixed = discountedPrice.toFixed(2);

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

												{images.length > 1 ? (
													<Slider {...imageSettings}>
														{images.map((img, index) => (
															<ImageWrapper key={index}>
																<picture>
																	<source
																		srcSet={`${img.url}?auto=format&fit=max&w=600&format=webp`}
																		type='image/webp'
																	/>
																	<ProductImage
																		src={`${img.url}?auto=format&fit=max&w=600`}
																		alt={`${product.productName} - view ${index + 1}`}
																		loading='lazy'
																	/>
																</picture>
															</ImageWrapper>
														))}
													</Slider>
												) : (
													<ImageWrapper>
														<picture>
															<source
																srcSet={`${images[0].url}?auto=format&fit=max&w=600&format=webp`}
																type='image/webp'
															/>
															<ProductImage
																src={`${images[0].url}?auto=format&fit=max&w=600`}
																alt={`${product.productName} - single view`}
																loading='lazy'
															/>
														</picture>
													</ImageWrapper>
												)}
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

/* ==== STYLES ==== */
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

		h2 {
			font-family: "Brush Script MT", cursive, sans-serif;
			color: var(--secondary-color-darker);
			font-size: 1.5rem;
			margin-top: 5px;
			margin-bottom: 5px;
			font-style: italic;
			font-weight: bolder;
			line-height: 1;
			text-align: left;
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

const OriginalPrice = styled.span`
	color: var(--secondary-color);
	text-decoration: line-through;
	margin-right: 8px;
`;

const DiscountedPrice = styled.span`
	color: var(--text-color-primary);
`;
