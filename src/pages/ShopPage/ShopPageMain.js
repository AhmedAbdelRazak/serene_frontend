import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import {
	Select,
	Input,
	Slider,
	Row,
	Col,
	Card,
	Pagination,
	Drawer,
	Button,
	ConfigProvider,
} from "antd";
import { useHistory, useLocation } from "react-router-dom";
import {
	ShoppingCartOutlined,
	FilterOutlined,
	ReloadOutlined,
} from "@ant-design/icons";
import { gettingFilteredProducts, getColors, readProduct } from "../../apiCore";
import { useCartContext } from "../../cart_context";
import ReactGA from "react-ga4";
import ShopPageHelmet from "./ShopPageHelmet";

const { Meta } = Card;
const { Option } = Select;
const { Search } = Input;

// Helper to see if a color name includes "white"
const isWhiteColorName = (c) => c.toLowerCase().includes("white");

// Sort colors so that any color containing "white" is pushed to the end
function reorderColorsToAvoidWhiteFirst(colorNames = []) {
	// Remove duplicates
	let unique = [...new Set(colorNames)];
	// Sort so that "white" is last
	unique.sort((a, b) => {
		const aIsWhite = isWhiteColorName(a);
		const bIsWhite = isWhiteColorName(b);
		// if a is white and b is not => push a to end
		if (aIsWhite && !bIsWhite) return 1;
		// if b is white and a is not => push b to end
		if (!aIsWhite && bIsWhite) return -1;
		return 0;
	});
	return unique;
}

// Extract color name from a Printify variant title, e.g. "S / Navy" => "Navy"
const parsePrintifyColor = (title = "") => {
	const splitted = title.split("/");
	if (splitted.length >= 2) return splitted[1].trim();
	return splitted[0].trim();
};

const ShopPageMain = () => {
	const history = useHistory();
	const location = useLocation();
	const [products, setProducts] = useState([]);
	const [totalRecords, setTotalRecords] = useState(0);
	const [colors, setColors] = useState([]);
	const [sizes, setSizes] = useState([]);
	const [categories, setCategories] = useState([]);
	const [genders, setGenders] = useState([]);
	const [priceRange, setPriceRange] = useState([0, 1000]);
	const [filters, setFilters] = useState({
		color: "",
		priceMin: 0,
		priceMax: 1000,
		category: "",
		size: "",
		gender: "",
		searchTerm: "",
		offers: new URLSearchParams(location.search).get("offers"), // "offers" filter
	});
	const [page, setPage] = useState(1);
	const [allColors, setAllColors] = useState([]);
	const [drawerVisible, setDrawerVisible] = useState(false);
	const records = 80;

	const { openSidebar2, addToCart } = useCartContext();

	useEffect(() => {
		ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_MEASUREMENTID);
		ReactGA.send(window.location.pathname + window.location.search);
		// eslint-disable-next-line
	}, [window.location.pathname]);

	useEffect(() => {
		// Fetch all colors
		getColors().then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setAllColors(data);
			}
		});
	}, []);

	const fetchFilteredProducts = useCallback(() => {
		const query = new URLSearchParams(filters).toString();
		gettingFilteredProducts(query, page, records).then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				const uniqueProductMap = {};

				const processedProducts = data.products
					.map((product) => {
						// If POD => store product once only
						if (product.printifyProductDetails?.POD) {
							uniqueProductMap[product._id] = product;
							return [product];
						}

						// Otherwise, expand by color attributes
						if (
							product.productAttributes &&
							product.productAttributes.length > 0
						) {
							const uniqueAttributes = product.productAttributes.reduce(
								(acc, attr) => {
									if (attr.productImages.length > 0 && !acc[attr.color]) {
										acc[attr.color] = {
											...product,
											productAttributes: [attr],
											thumbnailImage: product.thumbnailImage,
										};
									}
									return acc;
								},
								{}
							);

							Object.values(uniqueAttributes).forEach((attrProduct) => {
								uniqueProductMap[
									`${product._id}-${attrProduct.productAttributes[0].color}`
								] = attrProduct;
							});

							return Object.values(uniqueAttributes);
						} else {
							// Simple product
							uniqueProductMap[product._id] = product;
							return [product];
						}
					})
					.flat();

				// If your URL has ?category=someSlug, filter:
				const params = new URLSearchParams(location.search);
				const categorySlug = params.get("category");
				const uniqueProducts = categorySlug
					? processedProducts.filter(
							(p) => p.category?.categorySlug === categorySlug
						)
					: processedProducts;

				setProducts(uniqueProducts);
				setTotalRecords(data.totalRecords || 0);
				setColors(data.colors || []);
				setSizes(data.sizes || []);
				setCategories(data.categories || []);
				setGenders(data.genders || []);
				setPriceRange([
					data.priceRange?.minPrice || 0,
					data.priceRange?.maxPrice || 1000,
				]);
			}
		});
	}, [filters, page, location.search, records]);

	useEffect(() => {
		fetchFilteredProducts();
		window.setTimeout(() => {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}, 500);
	}, [filters, page, fetchFilteredProducts]);

	const handleFilterChange = (key, value) => {
		setFilters((prevFilters) => ({
			...prevFilters,
			[key]: value || "",
		}));
		setPage(1);
	};

	const resetFilters = () => {
		setFilters({
			color: "",
			priceMin: 0,
			priceMax: 1000,
			category: "",
			size: "",
			gender: "",
			searchTerm: "",
			offers: "",
		});
		setPage(1);
	};

	// Translate hexa to actual color name from your master color list
	const getColorNameFromHexa = (hexa) => {
		const colorObject = allColors.find((color) => color.hexa === hexa);
		return colorObject ? colorObject.color : "Unknown Color";
	};

	const showDrawer = () => {
		setDrawerVisible(true);
	};

	const closeDrawer = () => {
		setDrawerVisible(false);
	};

	// eslint-disable-next-line
	const getTransformedImageUrl = (url, width, height) => {
		if (!url) return "";
		const parts = url.split("upload/");
		const transformation = `upload/w_${width},h_${height},c_scale/`;
		return parts[0] + transformation + parts[1];
	};

	// Decide what link to push user to
	function getProductLink(product) {
		// If POD => link to /custom-gifts/<_id>
		if (product.isPrintifyProduct && product.printifyProductDetails?.POD) {
			return `/custom-gifts/${product._id}`;
		}
		// Otherwise => normal route
		return `/single-product/${product.slug}/${product.category?.categorySlug}/${product._id}`;
	}

	return (
		<ConfigProvider
			theme={{
				token: {
					colorPrimary: "var(--primary-color)",
					colorPrimaryHover: "var(--primary-color-dark)",
					colorText: "var(--text-color-primary)",
					colorBgContainer: "white",
					borderRadius: 8,
				},
			}}
		>
			<ShopPageHelmet products={products} />
			<ShopPageMainOverallWrapper>
				<ShopPageMainWrapper>
					{/* ====== DESKTOP FILTERS ====== */}
					<FiltersSection>
						<Row gutter={[16, 16]}>
							<Col span={6} style={{ textTransform: "capitalize" }}>
								<Select
									placeholder='Color'
									style={{ width: "100%" }}
									onChange={(value) => handleFilterChange("color", value)}
									dropdownRender={(menu) => (
										<div style={{ textTransform: "capitalize" }}>{menu}</div>
									)}
								>
									<Option value=''>All Colors</Option>
									{colors.map((color, index) => (
										<Option key={index} value={color}>
											{getColorNameFromHexa(color)}
										</Option>
									))}
								</Select>
							</Col>
							<Col span={6}>
								<Select
									placeholder='Category'
									style={{ width: "100%" }}
									onChange={(value) => handleFilterChange("category", value)}
								>
									<Option value=''>All Categories</Option>
									{categories.map((cat, i) => (
										<Option
											style={{ textTransform: "capitalize" }}
											key={i}
											value={cat.id}
										>
											{cat.name}
										</Option>
									))}
								</Select>
							</Col>
							<Col span={6}>
								<Select
									placeholder='Size'
									style={{ width: "100%" }}
									onChange={(value) => handleFilterChange("size", value)}
								>
									<Option value=''>All Sizes</Option>
									{sizes.map((size, index) => (
										<Option key={index} value={size}>
											{size}
										</Option>
									))}
								</Select>
							</Col>
							<Col span={6}>
								<Select
									placeholder='Gender'
									style={{ width: "100%" }}
									onChange={(value) => handleFilterChange("gender", value)}
								>
									<Option value=''>All Genders</Option>
									{genders.map((gender, index) => (
										<Option key={index} value={gender.id}>
											{gender.name}
										</Option>
									))}
								</Select>
							</Col>
						</Row>
						<Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
							<Col span={12}>
								<div style={{ marginBottom: "8px" }}>Price Range</div>
								<Slider
									range
									value={[filters.priceMin, filters.priceMax]}
									min={priceRange[0]}
									max={priceRange[1]}
									onChange={(value) => {
										handleFilterChange("priceMin", value[0]);
										handleFilterChange("priceMax", value[1]);
									}}
									onAfterChange={fetchFilteredProducts}
									tooltip={{ formatter: (value) => `$${value}` }}
								/>
								<div
									style={{ display: "flex", justifyContent: "space-between" }}
								>
									<span
										style={{
											fontWeight:
												filters.priceMin === priceRange[0] ? "bold" : "normal",
										}}
									>
										${priceRange[0]}
									</span>
									<span
										style={{
											fontWeight:
												filters.priceMax === priceRange[1] ? "bold" : "normal",
										}}
									>
										${priceRange[1]}
									</span>
								</div>
							</Col>
							<Col span={12} className='mt-3 py-2'>
								<Search
									placeholder='Search'
									onSearch={(value) => handleFilterChange("searchTerm", value)}
									enterButton
								/>
							</Col>
						</Row>
						<Row
							gutter={[16, 16]}
							style={{ marginTop: "20px", justifyContent: "flex-end" }}
						>
							<StyledButton onClick={resetFilters} icon={<ReloadOutlined />}>
								Reset Filters
							</StyledButton>
						</Row>
					</FiltersSection>

					{/* ====== MOBILE FILTERS ====== */}
					<SearchInputWrapper>
						<FiltersButton
							icon={<FilterOutlined />}
							onClick={showDrawer}
							className='mx-2'
						>
							Filters
						</FiltersButton>
						<Search
							placeholder='Search'
							onSearch={(value) => handleFilterChange("searchTerm", value)}
							className='mx-2'
						/>
					</SearchInputWrapper>
					<FiltersDrawer
						title='Filters'
						placement='left'
						closable={true}
						onClose={closeDrawer}
						visible={drawerVisible}
					>
						<Row gutter={[16, 16]}>
							<Col span={24}>
								<Select
									placeholder='Color'
									style={{ width: "100%" }}
									onChange={(value) => handleFilterChange("color", value)}
								>
									<Option value=''>All Colors</Option>
									{colors.map((color, index) => (
										<Option key={index} value={color}>
											{getColorNameFromHexa(color)}
										</Option>
									))}
								</Select>
							</Col>
							<Col span={24}>
								<Select
									placeholder='Category'
									style={{ width: "100%" }}
									onChange={(value) => handleFilterChange("category", value)}
								>
									<Option value=''>All Categories</Option>
									{categories.map((cat, i) => (
										<Option key={i} value={cat.id}>
											{cat.name}
										</Option>
									))}
								</Select>
							</Col>
							<Col span={24}>
								<Select
									placeholder='Size'
									style={{ width: "100%" }}
									onChange={(value) => handleFilterChange("size", value)}
								>
									<Option value=''>All Sizes</Option>
									{sizes.map((size, index) => (
										<Option key={index} value={size}>
											{size}
										</Option>
									))}
								</Select>
							</Col>
							<Col span={24}>
								<Select
									placeholder='Gender'
									style={{ width: "100%" }}
									onChange={(value) => handleFilterChange("gender", value)}
								>
									<Option value=''>All Genders</Option>
									{genders.map((gender, index) => (
										<Option key={index} value={gender.id}>
											{gender.name}
										</Option>
									))}
								</Select>
							</Col>
						</Row>
						<Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
							<Col span={24}>
								<div style={{ marginBottom: "8px" }}>Price Range</div>
								<Slider
									range
									value={[filters.priceMin, filters.priceMax]}
									min={priceRange[0]}
									max={priceRange[1]}
									onChange={(value) => {
										handleFilterChange("priceMin", value[0]);
										handleFilterChange("priceMax", value[1]);
									}}
									onAfterChange={fetchFilteredProducts}
									tooltip={{ formatter: (value) => `$${value}` }}
								/>
								<div
									style={{ display: "flex", justifyContent: "space-between" }}
								>
									<span
										style={{
											fontWeight:
												filters.priceMin === priceRange[0] ? "bold" : "normal",
										}}
									>
										${priceRange[0]}
									</span>
									<span
										style={{
											fontWeight:
												filters.priceMax === priceRange[1] ? "bold" : "normal",
										}}
									>
										${priceRange[1]}
									</span>
								</div>
							</Col>
							<Row
								gutter={[16, 16]}
								style={{ marginTop: "20px", justifyContent: "flex-end" }}
							>
								<StyledButton onClick={resetFilters} icon={<ReloadOutlined />}>
									Reset Filters
								</StyledButton>
							</Row>
						</Row>
					</FiltersDrawer>

					{/* ====== PRODUCT CARDS ====== */}
					<ProductsSection>
						<Row gutter={[16, 16]}>
							{products &&
								products.map((product, index) => {
									const isPOD =
										product.isPrintifyProduct &&
										product.printifyProductDetails?.POD;

									// 1) Collect all color names
									let colorNames = [];
									let mainColor = "";
									let originalPrice = product.price || 0;
									let discountedPrice =
										product.priceAfterDiscount > 0
											? product.priceAfterDiscount
											: product.price || 0;

									// 2) Decide images to display
									let productImages =
										product.thumbnailImage && product.thumbnailImage.length > 0
											? product.thumbnailImage[0].images
											: [];

									// ========== POD LOGIC ==========
									if (isPOD) {
										// Extract color names from all variants
										const variants =
											product.printifyProductDetails?.variants || [];
										colorNames = variants.map((v) =>
											parsePrintifyColor(v.title)
										);
										// Reorder so "white" goes last
										colorNames = reorderColorsToAvoidWhiteFirst(colorNames);
										// The first color after re-order is your main color
										mainColor = colorNames[0] || "";

										// If you store your price in the first variant, you can override:
										// e.g. originalPrice = variants[0]?.price / 100
										// etc.

										// For images, if you have product.images from Printify, use it:
										if (product.images && product.images.length > 0) {
											productImages = product.images;
										}
									} else {
										// ========== Non-POD LOGIC ==========
										const attrs = product.productAttributes || [];
										// Gather color names from all attributes
										const allAttrColorNames = attrs.map((a) =>
											getColorNameFromHexa(a.color)
										);
										colorNames =
											reorderColorsToAvoidWhiteFirst(allAttrColorNames);
										mainColor = colorNames[0] || product.color || "";

										// Find the matching attribute for that mainColor
										// fallback to the first attribute if none matches
										let chosenAttr = attrs.find(
											(a) =>
												getColorNameFromHexa(a.color).toLowerCase() ===
												mainColor.toLowerCase()
										);
										if (!chosenAttr && attrs.length > 0) {
											chosenAttr = attrs[0];
										}
										if (chosenAttr) {
											productImages = chosenAttr.productImages || productImages;
											originalPrice = chosenAttr.price || originalPrice;
											if (chosenAttr.priceAfterDiscount > 0) {
												discountedPrice = chosenAttr.priceAfterDiscount;
											}
										} else {
											// fallback if no matching attribute
											mainColor = product.color || "";
										}
									}

									// Calculate discount if any
									const discountPercentage =
										((originalPrice - discountedPrice) / originalPrice) * 100;

									// If no images or zero length, fallback
									const imageUrl =
										productImages && productImages.length > 0
											? productImages[0].url
											: "";

									// If you want a cloudinary transform
									// const transformedImageUrl = getTransformedImageUrl(imageUrl, 600, 600);

									// Limit colorNames to first 4
									const displayedColors = colorNames.slice(0, 4);

									// Product stock quantity
									const totalQuantity =
										product.productAttributes?.reduce(
											(acc, attr) => acc + attr.quantity,
											0
										) || product.quantity;

									return (
										<Col key={index} xs={24} sm={12} md={12} lg={6} xl={6}>
											<ProductCard
												hoverable
												cover={
													<ImageContainer>
														<BadgeContainer>
															{/* POD badge */}
															{isPOD && <PodBadge>Custom Design</PodBadge>}
															{/* Discount badge if discountPercentage > 0 */}
															{discountPercentage > 0 && (
																<DiscountBadge>
																	{discountPercentage.toFixed(0)}% OFF!
																</DiscountBadge>
															)}
														</BadgeContainer>

														{totalQuantity > 0 ? (
															<CartIcon
																onClick={(e) => {
																	e.stopPropagation();
																	ReactGA.event({
																		category: "Add To The Cart Products Page",
																		action:
																			"User Added Product From The Products Page",
																		label: `User added ${product.productName} to the cart`,
																	});
																	readProduct(product._id).then((data3) => {
																		if (data3 && data3.error) {
																			console.log(data3.error);
																		} else {
																			openSidebar2();
																			// For non-POD, pass chosenAttr
																			// For POD, pass null or the variant object if you want
																			const chosenAttr =
																				product.productAttributes?.[0] || null;
																			addToCart(
																				product._id,
																				null,
																				1,
																				data3,
																				chosenAttr
																			);
																		}
																	});
																}}
															/>
														) : (
															<OutOfStockBadge>Out of Stock</OutOfStockBadge>
														)}

														<ProductImage
															src={imageUrl}
															alt={product.productName}
															onClick={() => {
																ReactGA.event({
																	category: "Single Product Clicked",
																	action:
																		"User Navigated To Single Product From Products Page",
																	label: `User viewed ${product.productName}`,
																});
																window.scrollTo({ top: 0, behavior: "smooth" });
																history.push(getProductLink(product));
															}}
														/>
													</ImageContainer>
												}
											>
												{/* ======== Product Title & Price ======== */}
												<Meta
													title={product.productName}
													description={
														originalPrice > discountedPrice ? (
															<span>
																<OriginalPrice>
																	Price: ${originalPrice.toFixed(2)}
																</OriginalPrice>{" "}
																<DiscountedPrice>
																	${discountedPrice.toFixed(2)}
																</DiscountedPrice>
															</span>
														) : (
															<DiscountedPrice>
																Price: ${discountedPrice.toFixed(2)}
															</DiscountedPrice>
														)
													}
												/>

												{/* If POD, show cursive text */}
												{isPOD && (
													<CursiveText>
														Your Loved Ones Deserve 3 Minutes From Your Time To
														Customize Their Present!
													</CursiveText>
												)}

												{/* Candles => show scent; otherwise => show mainColor */}
												{product.category?.categoryName === "candles" &&
												product.scent ? (
													<p
														style={{
															textTransform: "capitalize",
															marginBottom: "4px",
														}}
													>
														Scent: {product.scent}
													</p>
												) : (
													mainColor &&
													displayedColors.length <= 1 && (
														<p
															style={{
																textTransform: "capitalize",
																marginBottom: "4px",
															}}
														>
															Color: {mainColor}
														</p>
													)
												)}

												{/* Show up to 4 colors if more exist */}
												{/* {displayedColors.length > 1 && (
													<p
														style={{
															textTransform: "capitalize",
															marginBottom: "4px",
														}}
													>
														Colors: {displayedColors.join(", ")}
													</p>
												)} */}
											</ProductCard>
										</Col>
									);
								})}
						</Row>
						<PaginationWrapper
							onClick={() => {
								window.scrollTo({ top: 0, behavior: "smooth" });
							}}
						>
							<Pagination
								current={page}
								pageSize={records}
								onChange={(page) => setPage(page)}
								total={totalRecords}
							/>
						</PaginationWrapper>
					</ProductsSection>
				</ShopPageMainWrapper>
			</ShopPageMainOverallWrapper>
		</ConfigProvider>
	);
};

export default ShopPageMain;

/* ======= STYLES ======= */
const ShopPageMainOverallWrapper = styled.div`
	background: white;
	margin: auto;
	overflow: hidden !important;
`;

const ShopPageMainWrapper = styled.div`
	min-height: 800px;
	padding: 100px 10px;
	max-width: 1800px;
	background: white;
	margin: auto;

	@media (max-width: 750px) {
		padding: 10px 3px;
	}
`;

const FiltersSection = styled.div`
	background: var(--background-light);
	padding: 20px;
	margin-bottom: 20px;
	border-radius: 8px;

	@media (max-width: 768px) {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}

	@media (max-width: 576px) {
		display: none; /* Hide filters on small screens */
	}
`;

const SearchInputWrapper = styled.div`
	@media (max-width: 576px) {
		display: flex;
		justify-content: center;
		margin-top: 5px;
		margin-bottom: 13px;
	}

	@media (min-width: 577px) {
		display: none; /* Hide button on larger screens */
	}
`;

const FiltersDrawer = styled(Drawer)`
	@media (min-width: 577px) {
		display: none; /* Hide drawer on larger screens */
	}
`;

const FiltersButton = styled(Button)`
	@media (min-width: 577px) {
		display: none; /* Hide button on larger screens */
	}
`;

const ProductsSection = styled.div`
	background: var(--background-light);
	padding: 20px;
	border-radius: 8px;
`;

const ProductCard = styled(Card)`
	border-radius: 10px;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	min-height: 600px;
	max-height: 625px;
	transition: var(--main-transition);
	text-transform: capitalize;

	&:hover {
		transform: translateY(-10px);
		box-shadow: var(--box-shadow-light);
	}

	@media (max-width: 700px) {
		min-height: 600px;
		max-height: 625px;
	}
`;

const ImageContainer = styled.div`
	position: relative;
	height: 500px;
	overflow: hidden;
	border-radius: 10px 10px 0 0;

	@media (max-width: 700px) {
		height: 500px;
	}
`;

const BadgeContainer = styled.div`
	position: absolute;
	top: 10px;
	left: 10px;
	z-index: 15;
	display: flex;
	flex-direction: column;
	gap: 5px;
`;

const PodBadge = styled.div`
	background-color: #ffafc5;
	color: #ffffff;
	padding: 4px 8px;
	border-radius: 4px;
	font-weight: bold;
	font-size: 0.8rem;
	box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
`;

const DiscountBadge = styled.div`
	background-color: var(--secondary-color-darker);
	color: var(--button-font-color);
	padding: 4px 8px;
	border-radius: 4px;
	font-weight: bold;
	font-size: 0.8rem;
	box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
`;

const ProductImage = styled.img`
	width: 100%;
	height: 100%;
	object-fit: cover;
	object-position: center;
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

const PaginationWrapper = styled.div`
	display: flex;
	justify-content: center;
	margin-top: 20px;
`;

const StyledButton = styled(Button)`
	background: var(--secondary-color);
	border-color: var(--secondary-color);
	color: var(--button-font-color);
	transition: var(--main-transition);

	&:hover {
		background: var(--secondary-color-dark);
		border-color: var(--secondary-color-dark);
	}
`;

const OriginalPrice = styled.span`
	color: var(--secondary-color);
	text-decoration: line-through;
	margin-right: 8px;
	font-weight: bold;
	line-height: 0;
`;

const DiscountedPrice = styled.span`
	color: var(--text-color-primary);
	font-weight: bold;
`;

/* Cursive text for POD products */
const CursiveText = styled.div`
	font-family: "Brush Script MT", cursive, sans-serif;
	color: #222;
	font-size: 1.3rem;
	margin-top: 5px;
	margin-bottom: 5px;
	font-style: italic;
	font-weight: bolder;
	line-height: 1;
`;
