import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import { Collapse } from "antd";
import { useCartContext } from "../../cart_context";
import { toast } from "react-toastify";
import { getColors, like, unlike, userlike, userunlike } from "../../apiCore";
import ColorsAndSizes from "./ColorsAndSizes";
import DisplayImages from "./DisplayImages";
import ReactGA from "react-ga4";
import {
	HeartOutlined,
	ShoppingCartOutlined,
	ArrowLeftOutlined,
} from "@ant-design/icons";
import CommentsAndRatings from "./CommentsAndRatings";
import { isAuthenticated } from "../../auth";
import RelatedProductsCarousel from "./RelatedProductsCarousel";
import SigninModal from "./SigninModal/SigninModal";
import { Helmet } from "react-helmet";

const { Panel } = Collapse;

const SingleProductWithVariables = ({ product, likee, setLikee }) => {
	const { addToCart, openSidebar2 } = useCartContext();
	const [selectedColor, setSelectedColor] = useState("");
	const [selectedSize, setSelectedSize] = useState("");
	const [chosenAttributes, setChosenAttributes] = useState({});
	const [chosenImages, setChosenImages] = useState([]);
	const [allColors, setAllColors] = useState([]);
	const [likes, setLikes] = useState(0);
	const [modalVisible3, setModalVisible3] = useState(false);

	const history = useHistory();
	const token = isAuthenticated() && isAuthenticated().token;
	const user = isAuthenticated() && isAuthenticated().user;

	useEffect(() => {
		getColors().then((data) => {
			if (data.error) {
				console.error(data.error);
			} else {
				setAllColors(data);
			}
		});
	}, []);

	const updateChosenAttributes = useCallback(
		(color, size) => {
			const attributes = product.productAttributes.find(
				(attr) => attr.color === color && attr.size === size
			);
			setChosenAttributes(attributes);

			const images = product.productAttributes
				.filter((attr) => attr.color === color && attr.productImages.length > 0)
				.flatMap((attr) => attr.productImages.map((img) => img.url));

			setChosenImages(images);
		},
		[product.productAttributes]
	);

	useEffect(() => {
		if (product.productAttributes.length > 0) {
			const initialColor = product.productAttributes[0].color;
			const initialSize = product.productAttributes[0].size;
			setSelectedColor(initialColor);
			setSelectedSize(initialSize);
			updateChosenAttributes(initialColor, initialSize);
		}

		const isProductLiked = product.likes.some(
			(like) => like.toString() === user._id
		);
		setLikee(isProductLiked);
		setLikes(product.likes.length);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [product, updateChosenAttributes, setLikee, user._id]);

	const handleColorChange = (color) => {
		setSelectedColor(color);
		updateChosenAttributes(color, selectedSize);
	};

	const handleSizeChange = (size) => {
		setSelectedSize(size);
		updateChosenAttributes(selectedColor, size);
	};

	const handleAddToCart = () => {
		if (!chosenAttributes) {
			toast.error("Please select valid color and size");
			return;
		}
		if (chosenAttributes.quantity <= 0) {
			toast.error("No enough stock available");
			return;
		}
		addToCart(product._id, null, 1, product, chosenAttributes);
		openSidebar2();
	};

	const handleBackToProducts = () => {
		history.push("/our-products");
	};

	const handleAddToWishlist = () => {
		if (!isAuthenticated()) {
			setModalVisible3(true);
			return;
		}

		setLikee(!likee);
		setLikes(likee ? likes - 1 : likes + 1);
		toast.info(likee ? "Removed from wishlist!" : "Added to wishlist!");

		const callApi = likee ? unlike : like;
		callApi(user._id, token, product._id).then((data) => {
			if (data.error) {
				setLikee(likee);
				setLikes(likee ? likes + 1 : likes - 1);
				toast.error(data.error);
			} else {
				setLikee(!likee);
				setLikes(data.likes.length);

				setTimeout(function () {
					window.location.reload(false);
				}, 2000);
			}
		});
	};

	const getColorName = (hex) => {
		if (!hex) return hex;
		const color = allColors.find(
			(c) => c.hexa.toLowerCase() === hex.toLowerCase()
		);
		return color ? color.color : hex;
	};

	const uniqueColors = [
		...new Set(product.productAttributes.map((attr) => attr.color)),
	].map((cc) => ({
		value: cc,
		name: getColorName(cc),
	}));

	const uniqueSizes = [
		...new Set(
			product.productAttributes
				.filter((attr) => attr.color === selectedColor)
				.map((attr) => attr.size)
		),
	];

	const priceDisplay = () => {
		const { priceAfterDiscount, price } = chosenAttributes;
		if (priceAfterDiscount && price && priceAfterDiscount < price) {
			return (
				<div>
					<StrikethroughPrice>${price}</StrikethroughPrice>{" "}
					<DiscountedPrice>${priceAfterDiscount}</DiscountedPrice>
				</div>
			);
		}
		return (
			<DiscountedPrice>
				${priceAfterDiscount || product.productAttributes[0].priceAfterDiscount}
			</DiscountedPrice>
		);
	};

	// eslint-disable-next-line
	const handleUserLikeToggle = () => {
		if (!isAuthenticated()) {
			toast.error("Please sign in to like this product");
			return;
		}

		const callApi = likee ? userunlike : userlike;
		callApi(user._id, token, product._id).then((data) => {
			if (data.error) {
				toast.error(data.error);
			} else {
				setLikee(!likee);
				toast.info(likee ? "Removed from your likes!" : "Liked!");
			}
		});
	};

	const capitalizeWords = (str) => {
		return str.replace(/\b\w/g, (char) => char.toUpperCase());
	};

	const gettingTotalProductQty = () => {
		let totalQuantity = 0;

		if (
			product &&
			product.productAttributes &&
			product.productAttributes.length > 0
		) {
			for (let i = 0; i < product.productAttributes.length; i++) {
				totalQuantity += product.productAttributes[i].quantity;
			}
		}

		return totalQuantity;
	};

	const isOutOfStock = chosenAttributes.quantity <= 0;

	return (
		<div>
			<Helmet itemscope itemtype='http://schema.org/Product'>
				<script type='application/ld+json'>
					{`
			{
				"@context": "http://schema.org/",
				"@type": "Product",
				"name": "${capitalizeWords(product.productName)}",
				"image": "${chosenImages[0]}",
				"description": "${product.description.replace(/<[^>]+>/g, "")}",
				"brand": {
					"@type": "Brand",
					"name": "${product.category.categoryName}"
				},
				"offers": {
					"@type": "Offer",
					"priceCurrency": "USD",
					"price": "${Number(chosenAttributes.priceAfterDiscount || product.productAttributes[0].priceAfterDiscount)}",
					"priceValidUntil": "2026-12-31",
					"availability": "${gettingTotalProductQty() > 0 ? "http://schema.org/InStock" : "http://schema.org/OutOfStock"}",
					"itemCondition": "http://schema.org/NewCondition",
					"hasMerchantReturnPolicy": {
						"@type": "MerchantReturnPolicy",
						"returnPolicyCategory": "https://serenejannat.com/privacy-policy-terms-conditions",
						"merchantReturnDays": "7",
						"merchantReturnLink": "https://serenejannat.com/privacy-policy-terms-conditions"
					},
					"shippingDetails": {
						"@type": "OfferShippingDetails",
						"shippingRate": {
							"@type": "MonetaryAmount",
							"value": "5.00",
							"currency": "USD"
						},
						"deliveryTime": {
							"@type": "ShippingDeliveryTime",
							"handlingTime": {
								"@type": "QuantitativeValue",
								"minValue": 0,
								"maxValue": 1,
								"unitCode": "d"
							},
							"transitTime": {
								"@type": "QuantitativeValue",
								"minValue": 3,
								"maxValue": 7,
								"unitCode": "d"
							}
						},
						"shippingDestination": {
							"@type": "DefinedRegion",
							"geoMidpoint": {
								"@type": "GeoCoordinates",
								"latitude": 37.7749,
								"longitude": -122.4194
							}
						}
					}
				},
				"aggregateRating": {
					"@type": "AggregateRating",
					"ratingValue": "${(product.ratings.reduce((acc, rating) => acc + rating.star, 0) / product.ratings.length).toFixed(1)}",
					"reviewCount": "${product.ratings.length}"
				},
				"review": ${JSON.stringify(
					product.comments.map((comment) => ({
						"@type": "Review",
						reviewRating: {
							"@type": "Rating",
							ratingValue: comment.rating || 5, // Default to 5 if no rating provided
						},
						author: {
							"@type": "Person",
							name: comment.postedBy ? comment.postedBy.name : "Anonymous",
						},
						reviewBody: comment.text,
						datePublished: new Date(comment.created).toISOString(),
					}))
				)},
				"productID": "${product._id}"
			}
		`}
				</script>
				<link
					rel='canonical'
					href={`https://serenejannat.com/single-product/${product.slug}/${product.category.categorySlug}/${product._id}`}
				/>
				<meta
					property='og:title'
					content={capitalizeWords(product.productName)}
				/>
				<meta
					property='og:description'
					content={product.description.replace(/<[^>]+>/g, "")}
				/>
				<meta property='og:image' content={chosenImages[0]} />
				<meta
					property='og:url'
					content={`https://serenejannat.com/single-product/${product.slug}/${product.category.categorySlug}/${product._id}`}
				/>
				<meta property='og:type' content='product' />
				<meta
					property='product:price:amount'
					content={
						chosenAttributes.priceAfterDiscount ||
						product.productAttributes[0].priceAfterDiscount
					}
				/>
				<meta property='product:price:currency' content='USD' />
				<meta
					property='product:availability'
					content={`${gettingTotalProductQty() > 0 ? "instock" : "outofstock"}`}
				/>
				<meta property='product:condition' content='new' />
				<meta property='product:id' content={product._id} />
				<meta
					name='keywords'
					content={`${product.category.categoryName}, ${product.productName}, ${product.subcategory && product.subcategory[0].SubcategoryName}, ${product.subcategory && product.subcategory[1] && product.subcategory[1].SubcategoryName}`}
				/>
				<meta charSet='utf-8' />
				<title>
					{capitalizeWords(
						`${product.category.categoryName} | ${product.productName}`
					)}
				</title>
				<meta
					name='description'
					content={product.description.replace(/<[^>]+>/g, "")}
				/>
				<link
					rel='stylesheet'
					href='http://fonts.googleapis.com/earlyaccess/droidarabickufi.css'
				/>
			</Helmet>

			<SigninModal
				modalVisible3={modalVisible3}
				setModalVisible3={setModalVisible3}
			/>
			<SingleProductWrapper>
				<ProductImagesWrapper>
					<DisplayImages images={chosenImages} />
				</ProductImagesWrapper>
				<ProductDetailsWrapper>
					<ProductTitle>{product.productName}</ProductTitle>
					{isOutOfStock && (
						<OutOfStockMessage>🚚 No Enough Stock</OutOfStockMessage>
					)}
					<ProductPrice>{priceDisplay()}</ProductPrice>
					<ColorsAndSizes
						colors={uniqueColors}
						sizes={uniqueSizes}
						selectedColor={selectedColor}
						selectedSize={selectedSize}
						handleColorChange={handleColorChange}
						handleSizeChange={handleSizeChange}
					/>
					<CollapseContainer>
						<Collapse
							defaultActiveKey={
								uniqueSizes.length === 1 && uniqueSizes[0] === "nosizes"
									? ["1"]
									: []
							}
						>
							<Panel header='Product Description' key='1'>
								<ProductDescription
									dangerouslySetInnerHTML={{ __html: product.description }}
								/>
								{uniqueSizes.length === 1 && uniqueSizes[0] === "nosizes" && (
									<StyledGeoDataList>
										{product.geodata && product.geodata.length && (
											<li>Length: {product.geodata.length} in</li>
										)}
										{product.geodata && product.geodata.width && (
											<li>Width: {product.geodata.width} in</li>
										)}
										{product.geodata && product.geodata.height && (
											<li>Height: {product.geodata.height} in</li>
										)}
										{product.geodata && product.geodata.weight && (
											<li>Weight: {product.geodata.weight} lbs</li>
										)}
									</StyledGeoDataList>
								)}
							</Panel>
						</Collapse>
					</CollapseContainer>
					{chosenAttributes.SubSKU && (
						<SubSKU>
							<strong>SKU:</strong> {chosenAttributes.SubSKU}
						</SubSKU>
					)}
					<ButtonContainer>
						<ActionButton
							onClick={() => {
								handleAddToCart();
								ReactGA.event({
									category: "SingleProduct Add To Cart",
									action: "User Added To The Cart From Single Product",
								});
							}}
							color='var(--primary-color-darker)'
							disabled={isOutOfStock}
						>
							<ShoppingCartOutlined />{" "}
							{isOutOfStock ? "Out Of Stock" : "Add to Cart"}
						</ActionButton>
						<ActionButton
							onClick={handleAddToWishlist}
							color={
								likee ? "var(--secondary-color-dark)" : "var(--secondary-color)"
							}
						>
							<HeartOutlined />{" "}
							{likee ? "Remove from Wishlist" : "Add to Wishlist"}
						</ActionButton>

						<ActionButton
							onClick={handleBackToProducts}
							color='var(--accent-color-2-dark)'
						>
							<ArrowLeftOutlined /> Back to Products
						</ActionButton>
					</ButtonContainer>
				</ProductDetailsWrapper>
			</SingleProductWrapper>
			<CommentsAndRatings product={product} user={user} token={token} />
			<div className='my-3'>
				{product &&
				product.relatedProducts &&
				product.relatedProducts.length > 0 ? (
					<RelatedProductsCarousel relatedProducts={product.relatedProducts} />
				) : null}
			</div>
		</div>
	);
};

export default SingleProductWithVariables;

const SingleProductWrapper = styled.div`
	display: flex;
	flex-wrap: wrap;
	padding: 20px;
	background: var(--background-light);
	border-radius: 10px;
	box-shadow: var(--box-shadow-light);
	overflow-y: auto;
`;

const ProductImagesWrapper = styled.div`
	flex: 6;
	min-width: 500px;
	margin-right: 20px;

	img {
		width: 100%;
		height: 500px;
		object-fit: contain;
		border-radius: 5px;
	}

	@media (max-width: 768px) {
		flex: 1 1 100%;
		margin-right: 0;
		min-width: 300px;

		img {
			width: 100%;
			height: 400px;
		}
	}
`;

const ProductDetailsWrapper = styled.div`
	flex: 6;
	display: flex;
	flex-direction: column;
	gap: 10px;

	@media (max-width: 768px) {
		flex: 1 1 100%;
		margin-top: 20px;
	}
`;

const ProductTitle = styled.h1`
	font-size: 24px;
	font-weight: bold;
	margin-bottom: 10px;
	color: var(--text-color-primary);
	text-transform: capitalize;
`;

const ProductPrice = styled.h2`
	font-size: 20px;
	color: var(--text-color-primary);
	margin-bottom: 20px;
	font-weight: bold;
`;

const OutOfStockMessage = styled.p`
	color: darkred;
	font-weight: bold;
	font-size: 14px;
	display: flex;
	align-items: center;
	gap: 5px;
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

const CollapseContainer = styled.div`
	margin-bottom: 20px;
`;

const ButtonContainer = styled.div`
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	gap: 10px;

	@media (max-width: 768px) {
		flex-direction: column;
		button {
			margin-bottom: 10px;
		}
	}
`;

const ActionButton = styled.button`
	padding: 10px 20px;
	background: ${(props) => props.color};
	color: var(--button-font-color);
	border: none;
	border-radius: 5px;
	cursor: pointer;
	font-size: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	max-width: 300px;
	text-align: center;
	margin: auto;
	transition: var(--main-transition);

	&:hover {
		background: ${(props) => darkenColor(props.color)};
		transition: var(--main-transition);
	}

	&:disabled {
		background: var(--neutral-medium);
		cursor: not-allowed;
	}
`;

const darkenColor = (color) => {
	switch (color) {
		case "var(--primary-color)":
			return "var(--primary-color-dark)";
		case "var(--primary-color-darker)":
			return "var(--primary-color)";
		case "var(--secondary-color)":
			return "var(--secondary-color-dark)";
		case "var(--accent-color-2-dark)":
			return "var(--accent-color-2)";
		case "var(--neutral-dark)":
			return "var(--neutral-darker)";
		default:
			return color;
	}
};

const ProductDescription = styled.div`
	font-size: 16px;
	line-height: 1.5;
	color: var(--text-color-secondary);
`;

const SubSKU = styled.div`
	font-size: 16px;
	color: var(--text-color-secondary);
`;

const StyledGeoDataList = styled.ul`
	list-style: disc inside;
	padding: 0;
	margin-top: 10px;
	color: var(--text-color-primary);
	font-weight: bold;

	li {
		margin-bottom: 5px;
		color: var(--text-color-secondary);
	}
`;
