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

const ShopPageMain = () => {
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
	});
	const [page, setPage] = useState(1);
	const [allColors, setAllColors] = useState([]);
	const [drawerVisible, setDrawerVisible] = useState(false);
	const records = 60;

	const history = useHistory();
	const location = useLocation();
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
				// Process the products to handle variables and unique colors
				const uniqueProductMap = {};

				const processedProducts = data.products
					.map((product) => {
						if (
							product.productAttributes &&
							product.productAttributes.length > 0
						) {
							// Filter product attributes to get unique colors with images
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

							// Add each unique color product to the map to ensure uniqueness
							Object.values(uniqueAttributes).forEach((attrProduct) => {
								uniqueProductMap[
									`${product._id}-${attrProduct.productAttributes[0].color}`
								] = attrProduct;
							});

							// Return an array of products split by unique color attributes
							return Object.values(uniqueAttributes);
						}
						// Return simple products as is
						uniqueProductMap[product._id] = product;
						return [product];
					})
					.flat();

				// Convert the unique product map back to an array
				const params = new URLSearchParams(location.search);
				const categorySlug = params.get("category");
				const uniqueProducts = categorySlug
					? Object.values(processedProducts).filter(
							(product) => product.category.categorySlug === categorySlug
						)
					: Object.values(processedProducts);

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
	}, [filters, page, location.search]);

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
		});
		setPage(1);
	};

	const getColorName = (hexa) => {
		const colorObject = allColors.find((color) => color.hexa === hexa);
		return colorObject ? colorObject.color : "Unknown Color";
	};

	const showDrawer = () => {
		setDrawerVisible(true);
	};

	const closeDrawer = () => {
		setDrawerVisible(false);
	};

	const getTransformedImageUrl = (url, width, height) => {
		if (!url) return "";
		const parts = url.split("upload/");
		const transformation = `upload/w_${width},h_${height},c_scale/`;
		return parts[0] + transformation + parts[1];
	};

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
											{getColorName(color)}
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
									{categories.map((category, i) => (
										<Option key={i} value={category.id}>
											{category.name}
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
									onAfterChange={fetchFilteredProducts} // Fetch data after dragging stops
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
											{getColorName(color)}
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
									{categories.map((category, index) => (
										<Option key={index} value={category.id}>
											{category.name}
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
									onAfterChange={fetchFilteredProducts} // Fetch data after dragging stops
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
					<ProductsSection>
						<Row gutter={[16, 16]}>
							{products &&
								products.map((product, index) => {
									const productImages =
										product.productAttributes &&
										product.productAttributes.length > 0
											? product.productAttributes[0].productImages
											: product.thumbnailImage[0].images;
									const imageUrl =
										productImages && productImages.length > 0
											? productImages[0].url
											: "";

									const chosenProductAttributes =
										product.productAttributes &&
										product.productAttributes.length > 0
											? product.productAttributes[0]
											: null;

									const colorName =
										chosenProductAttributes &&
										getColorName(chosenProductAttributes.color);

									const originalPrice =
										chosenProductAttributes && chosenProductAttributes.price
											? chosenProductAttributes.price
											: product.price;
									const discountedPrice =
										product.priceAfterDiscount > 0
											? product.priceAfterDiscount
											: chosenProductAttributes.priceAfterDiscount;

									const discountPercentage =
										((originalPrice - discountedPrice) / originalPrice) * 100;

									// eslint-disable-next-line
									const transformedImageUrl = getTransformedImageUrl(
										imageUrl,
										1200, // Adjust width here
										1220 // Adjust height here
									);

									const totalQuantity =
										product.productAttributes.reduce(
											(acc, attr) => acc + attr.quantity,
											0
										) || product.quantity;

									return (
										<Col key={index} xs={24} sm={12} md={12} lg={6} xl={6}>
											<ProductCard
												hoverable
												cover={
													<ImageContainer>
														{discountPercentage > 0 && (
															<DiscountBadge>
																{discountPercentage.toFixed(2)}% OFF!
															</DiscountBadge>
														)}
														{totalQuantity > 0 ? (
															<CartIcon
																onClick={(e) => {
																	ReactGA.event({
																		category: "Add To The Cart Products Page",
																		action:
																			"User Added Product From The Products Page",
																		label: `User added ${product.productName} to the cart from Products Page`,
																	});
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
														<ProductImage
															src={imageUrl}
															// src={transformedImageUrl}
															alt={product.productName}
															onClick={() => {
																ReactGA.event({
																	category: "Single Product Clicked",
																	action:
																		"User Navigated To Single Product From Products Page",
																	label: `User Navigated to ${product.productName} single page`,
																});
																window.scrollTo({ top: 0, behavior: "smooth" });
																history.push(
																	`/single-product/${product.slug}/${product.category.categorySlug}/${product._id}`
																);
															}}
														/>
													</ImageContainer>
												}
											>
												<Meta
													title={product.productName}
													description={
														originalPrice > discountedPrice ? (
															<span>
																<OriginalPrice>
																	Price: ${originalPrice}
																</OriginalPrice>{" "}
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
												{colorName &&
												product.category.categoryName !== "candles" ? (
													<p style={{ textTransform: "capitalize" }}>
														Color: {colorName}
													</p>
												) : product.color ? (
													<p style={{ textTransform: "capitalize" }}>
														Color: {product.color}
													</p>
												) : null}

												{product.category.categoryName === "candles" &&
													product.scent && (
														<p style={{ textTransform: "capitalize" }}>
															Scent: {product.scent}
														</p>
													)}
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
	max-height: 600px;
	transition: var(--main-transition);
	text-transform: capitalize;

	&:hover {
		transform: translateY(-10px);
		box-shadow: var(--box-shadow-light);
	}

	@media (max-width: 700px) {
		min-height: 500px;
		max-height: 500px;
	}
`;

const ImageContainer = styled.div`
	position: relative;
	height: 500px;
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

const DiscountBadge = styled.div`
	position: absolute;
	top: 10px;
	left: 10px;
	background-color: var(--secondary-color-darker);
	color: var(--button-font-color);
	padding: 5px 10px;
	border-radius: 5px;
	font-weight: bold;
	z-index: 10;
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
`;

const DiscountedPrice = styled.span`
	color: var(--text-color-primary);
	font-weight: bold;
`;
