import React from "react";
import { Card } from "antd";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useCartContext } from "../cart_context";
import { readProduct } from "../apiCore";

const { Meta } = Card;

const ProductCard = ({ product }) => {
	const history = useHistory();
	const { openSidebar2, addToCart } = useCartContext();

	const handleAddToCart = (e) => {
		e.stopPropagation();
		readProduct(product._id).then((data) => {
			if (data && data.error) {
				console.log(data.error);
			} else {
				const chosenProductAttributes = product.productAttributes
					? product.productAttributes[0]
					: {};
				openSidebar2();
				addToCart(product._id, null, 1, data, chosenProductAttributes);
			}
		});
	};

	const productImages =
		product.productAttributes && product.productAttributes.length > 0
			? product.productAttributes[0].productImages
			: product.thumbnailImage[0]?.images || [];
	const imageUrl = productImages.length > 0 ? productImages[0].url : "";

	const chosenProductAttributes =
		product.productAttributes && product.productAttributes.length > 0
			? product.productAttributes[0]
			: {};

	const colorName =
		chosenProductAttributes.color || product.color || "Unknown Color";

	const priceDisplay = () => {
		const { priceAfterDiscount, price } = chosenProductAttributes;
		if (priceAfterDiscount && price && priceAfterDiscount < price) {
			return (
				<div>
					<StrikethroughPrice>${price}</StrikethroughPrice>{" "}
					<DiscountedPrice>${priceAfterDiscount}</DiscountedPrice>
				</div>
			);
		}
		return (
			<DiscountedPrice>${priceAfterDiscount || product.price}</DiscountedPrice>
		);
	};

	return (
		<StyledCard
			hoverable
			cover={
				<ImageContainer>
					<CartIcon onClick={handleAddToCart} />
					<ProductImage
						src={imageUrl}
						alt={product.productName}
						onClick={() => {
							window.scrollTo({ top: 0, behavior: "smooth" });
							history.push(
								`/single-product/${product.slug}/${product.category.categorySlug}/${product._id}`
							);
						}}
					/>
				</ImageContainer>
			}
		>
			<Meta title={product.productName} description={priceDisplay()} />
			{colorName && <p>Color: {colorName}</p>}
		</StyledCard>
	);
};

export default ProductCard;

const StyledCard = styled(Card)`
	border-radius: 10px;
	overflow: hidden;
	min-height: 400px;
	transition: var(--main-transition);
	text-transform: capitalize;

	&:hover {
		transform: translateY(-10px);
		box-shadow: var(--box-shadow-light);
	}

	@media (max-width: 700px) {
		min-height: 200px;
	}
`;

const ImageContainer = styled.div`
	position: relative;
`;

const ProductImage = styled.img`
	width: 100%;
	height: 100%;
	object-fit: cover;
	cursor: pointer;
`;

const CartIcon = styled(ShoppingCartOutlined)`
	position: absolute;
	top: 20px;
	right: 20px;
	font-size: 24px;
	color: var(--button-font-color);
	background-color: rgba(0, 0, 0, 0.5);
	border-radius: 50%;
	padding: 3px;
	cursor: pointer;
	z-index: 10;

	&:hover {
		color: var(--secondary-color-light);
	}
`;

const StrikethroughPrice = styled.span`
	font-size: 18px;
	color: var(--secondary-color-dark);
	text-decoration: line-through;
	margin-right: 10px;
`;

const DiscountedPrice = styled.span`
	font-size: 20px;
	color: var(--primary-color);
	font-weight: bold;
`;
