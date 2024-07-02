import React from "react";
import styled from "styled-components";
import Slider from "react-slick";
import { Card } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useCartContext } from "../../cart_context";
import { readProduct } from "../../apiCore";
import { useHistory } from "react-router-dom";

const { Meta } = Card;

const ZNewArrival = ({ newArrivalProducts }) => {
	const { openSidebar2, addToCart } = useCartContext();
	const history = useHistory();

	const settings = {
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
	};

	const imageSettings = {
		dots: true,
		infinite: true,
		speed: 1500,
		slidesToShow: 1,
		slidesToScroll: 1,
		autoplay: true,
		autoplaySpeed: 4000,
	};

	return (
		<Container>
			<ZNewArrivalWrapper>
				<h2>New Arrivals</h2>
				<Slider {...settings}>
					{newArrivalProducts &&
						newArrivalProducts.map((product, i) => {
							const chosenProductAttributes = product.productAttributes[0];
							const images =
								product.productAttributes[0]?.productImages ||
								product.thumbnailImage[0].images;

							const originalPrice = product.price;
							const discountedPrice =
								product.priceAfterDiscount > 0
									? product.priceAfterDiscount
									: chosenProductAttributes.priceAfterDiscount;

							const totalQuantity =
								product.productAttributes.reduce(
									(acc, attr) => acc + attr.quantity,
									0
								) || product.quantity;

							return (
								<div key={i} className='slide'>
									<ProductCard
										hoverable
										onClick={() => {
											window.scrollTo({ top: 0, behavior: "smooth" });
											history.push(
												`/single-product/${product.slug}/${product.category.categorySlug}/${product._id}`
											);
										}}
										cover={
											<ImageContainer>
												{totalQuantity > 0 ? (
													<CartIcon
														onClick={(e) => {
															e.stopPropagation();
															readProduct(product._id).then((data3) => {
																if (data3 && data3.error) {
																	console.log(data3.error);
																} else {
																	openSidebar2();
																	addToCart(
																		product._id,
																		null,
																		1,
																		data3,
																		chosenProductAttributes
																	);
																}
															});
														}}
													/>
												) : (
													<OutOfStockBadge>Out of Stock</OutOfStockBadge>
												)}
												{images.length > 1 ? (
													<Slider {...imageSettings}>
														{images.map((img, index) => (
															<ImageWrapper key={index}>
																<ProductImage
																	src={img.url}
																	alt={`${product.productName} - view ${index + 1}`}
																/>
															</ImageWrapper>
														))}
													</Slider>
												) : (
													<ImageWrapper>
														<ProductImage
															src={images[0].url}
															alt={`${product.productName} - single view`}
														/>
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
														<OriginalPrice>${originalPrice}</OriginalPrice>{" "}
														<DiscountedPrice>
															${discountedPrice}
														</DiscountedPrice>
													</span>
												) : (
													<DiscountedPrice>
														Price: ${discountedPrice}
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
`;

const ProductImage = styled.img`
	width: 100%;
	height: 100%;
	object-fit: fill;
	object-position: center;
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
