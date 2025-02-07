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

const ZFeaturedProducts = ({ featuredProducts }) => {
	const { openSidebar2, addToCart } = useCartContext();
	const history = useHistory();

	// Memoize the main slider settings so they're created only once.
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
	const handleCartIconClick = useCallback(
		async (product, e) => {
			e.stopPropagation();
			if (product.isPrintifyProduct && product.printifyProductDetails?.POD) {
				history.push(`/custom-gifts/${product._id}`);
				return;
			}
			ReactGA.event({
				category: "Add To The Cart Featured Products",
				action: "User Added Featured Product To The Cart",
				label: `User added ${product.productName} to the cart from Featured Products`,
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

	// Memoize the navigation handler.
	const navigateToProduct = useCallback(
		(product) => {
			if (product.isPrintifyProduct && product.printifyProductDetails?.POD) {
				history.push(`/custom-gifts/${product._id}`);
				return;
			}
			ReactGA.event({
				category: "Featured Product Clicked",
				action: "Featured Product Clicked",
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
			<ZFeaturedProductsWrapper>
				<h2>Featured Products</h2>
				<Slider {...settings}>
					{featuredProducts &&
						featuredProducts.map((product, i) => {
							const chosenProductAttributes = product.productAttributes[0];
							const images =
								chosenProductAttributes?.productImages ||
								product.thumbnailImage[0].images;

							// Original & discounted prices (2 decimals)
							const originalPrice =
								chosenProductAttributes?.price || product.price || 0;
							const discountedPrice =
								product.priceAfterDiscount > 0
									? product.priceAfterDiscount
									: chosenProductAttributes?.priceAfterDiscount || 0;

							const originalPriceFixed = originalPrice.toFixed(2);
							const discountedPriceFixed = discountedPrice.toFixed(2);

							const discountPercentage =
								originalPrice > 0
									? ((originalPrice - discountedPrice) / originalPrice) * 100
									: 0;

							const totalQuantity =
								product.productAttributes.reduce(
									(acc, attr) => acc + attr.quantity,
									0
								) || product.quantity;

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
												{/* Display discount badge if applicable */}
												{discountPercentage > 0 && (
													<DiscountBadge>
														{discountPercentage.toFixed(0)}% OFF!
													</DiscountBadge>
												)}

												{/* Display POD badge if applicable */}
												{isPOD && <PodBadge>Custom Design 💖</PodBadge>}

												{totalQuantity > 0 ? (
													<CartIcon
														onClick={(e) => handleCartIconClick(product, e)}
													/>
												) : (
													<OutOfStockBadge>Out of Stock</OutOfStockBadge>
												)}

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
			</ZFeaturedProductsWrapper>
		</Container>
	);
};

export default ZFeaturedProducts;

/* =================== STYLES =================== */
const Container = styled.div`
	background: var(--neutral-light2);
	padding: 10px;
	border-radius: 5px;
	margin-top: 50px;
	margin-bottom: 50px;
`;

const ZFeaturedProductsWrapper = styled.div`
	max-width: 1400px;
	margin: auto;

	h2 {
		font-weight: bold;
		text-align: center;
		margin-bottom: 40px;
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
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
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

const CartIcon = styled(ShoppingCartOutlined)`
	position: absolute;
	top: 20px;
	right: 20px;
	font-size: 24px;
	color: var(--accent-color-3);
	background-color: rgba(0, 0, 0, 0.5);
	border-radius: 50%;
	padding: 3px;
	cursor: pointer;
	z-index: 10;

	&:hover {
		color: var(--accent-color-3-dark);
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

const DiscountBadge = styled.div`
	position: absolute;
	top: 15px;
	left: 15px;
	background-color: var(--secondary-color-darker);
	color: var(--button-font-color);
	padding: 5px 10px;
	border-radius: 5px;
	font-weight: bold;
	z-index: 10;
`;

const OriginalPrice = styled.span`
	color: var(--secondary-color);
	text-decoration: line-through;
	margin-right: 8px;
`;

const DiscountedPrice = styled.span`
	color: var(--text-color-primary);
`;

/* === New custom design badge for POD === */
const PodBadge = styled.div`
	position: absolute;
	top: 45px; /* below the discount badge so they don't overlap */
	left: 15px;
	background-color: #ffafc5; /* pinkish color */
	color: #ffffff;
	padding: 4px 8px;
	border-radius: 4px;
	font-weight: bold;
	font-size: 0.8rem;
	z-index: 11; /* ensure it's above discount badge if needed */
	box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
`;
