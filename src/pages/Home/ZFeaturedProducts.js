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

const ZFeaturedProducts = ({ featuredProducts }) => {
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
			<ZFeaturedProductsWrapper>
				<h2>Featured Products</h2>
				<Slider {...settings}>
					{featuredProducts &&
						featuredProducts.map((product, i) => {
							var chosenProductAttributes = product.productAttributes[0];
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
												<CartIcon
													onClick={(e) => {
														e.stopPropagation(); // Prevent the card click event
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
												<Slider {...imageSettings}>
													{(
														(product.productAttributes &&
															product.productAttributes.length > 0 &&
															product.productAttributes[0].productImages) ||
														product.thumbnailImage[0].images
													).map((img, index) => (
														<ImageWrapper key={index}>
															<ProductImage
																src={img.url}
																alt={`${product.productName} - view ${index + 1}`}
															/>
														</ImageWrapper>
													))}
												</Slider>
											</ImageContainer>
										}
									>
										<Meta
											title={product.productName}
											description={`Price: $${
												product.priceAfterDiscount > 0
													? product.priceAfterDiscount
													: product.productAttributes[0].priceAfterDiscount
											}`}
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

	.slick-arrow,
	.slick-prev {
		display: none !important;
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

	&:hover {
		transform: translateY(-10px);
		box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
	}

	.ant-card-cover {
		margin: -16px -16px 0 -16px; /* Remove the default padding */
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
	height: 400px;
	overflow: hidden;
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
