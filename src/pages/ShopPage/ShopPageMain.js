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
import ReactPixel from "react-facebook-pixel";

import ShopPageHelmet from "./ShopPageHelmet";

const { Meta } = Card;
const { Option } = Select;
const { Search } = Input;

function ShopPageMain() {
	const history = useHistory();
	const location = useLocation();

	// Keep these states as arrays/strings by default to avoid any .map errors.
	const [products, setProducts] = useState([]);
	const [totalRecords, setTotalRecords] = useState(0);

	const [colors, setColors] = useState([]);
	const [sizes, setSizes] = useState([]);
	const [categories, setCategories] = useState([]);
	const [genders, setGenders] = useState([]);
	const [priceRange, setPriceRange] = useState([0, 1000]);
	const [allColors, setAllColors] = useState([]);

	const [filters, setFilters] = useState({
		color: "",
		priceMin: 0,
		priceMax: 1000,
		category: "",
		size: "",
		gender: "",
		searchTerm: "",
		offers: new URLSearchParams(location.search).get("offers"),
	});

	const [page, setPage] = useState(1);
	const [drawerVisible, setDrawerVisible] = useState(false);

	// How many products per page:
	const records = 80;

	const { openSidebar2, addToCart } = useCartContext();

	// (1) Cloudinary Transform Helper
	//     If the URL isn't Cloudinary, returns original.
	//     Otherwise, inserts f_auto,q_auto,w_{width} + optional f_webp.
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
		const finalTransform = forceWebP
			? `${baseTransform},f_webp`
			: baseTransform;

		// Reconstruct URL
		// e.g. https://res.cloudinary.com/.../upload/f_auto,q_auto,w_600/...
		return `${parts[0]}/upload/${finalTransform}/${parts[1]}`;
	};

	// Initialize GA and track page views
	useEffect(() => {
		// Fix: Pass an object to avoid the "Send command doesn't exist" error
		ReactGA.send({
			hitType: "pageview",
			page: window.location.pathname + window.location.search,
		});
		// eslint-disable-next-line
	}, [window.location.pathname, window.location.search]);

	// Fetch master color list
	useEffect(() => {
		getColors().then((data) => {
			if (data?.error) {
				console.log(data.error);
			} else {
				setAllColors(data || []);
			}
		});
	}, []);

	// Fetch filtered products
	const fetchFilteredProducts = useCallback(() => {
		// Convert filters to a query string
		const query = new URLSearchParams(filters).toString();

		gettingFilteredProducts(query, page, records).then((data) => {
			if (data?.error) {
				console.log(data.error);
			} else {
				// We'll use a map to ensure uniqueness
				const uniqueProductMap = {};

				const processed = (data.products || [])
					.map((product) => {
						const isPOD = product?.printifyProductDetails?.POD;
						const productAttributes = product?.productAttributes || [];

						// ==========================
						// 1) POD PRODUCTS (isPOD)
						// ==========================
						if (isPOD && productAttributes.length > 0) {
							// Group attributes by color code
							const colorGroups = {};
							productAttributes.forEach((attr) => {
								const c = attr?.color || "unknown"; // fallback
								if (!colorGroups[c]) {
									colorGroups[c] = [];
								}
								colorGroups[c].push(attr);
							});

							// For each color group, create a sub-product
							return Object.keys(colorGroups).map((colorCode) => {
								const attrList = colorGroups[colorCode];
								const firstAttr = attrList?.[0] || {};
								const colorTotalQty = attrList.reduce(
									(acc, a) => acc + (a.quantity || 0),
									0
								);

								// Decide a price from first attribute
								const subPrice = firstAttr?.price || 0;
								const subPriceAfterDiscount =
									firstAttr?.priceAfterDiscount &&
									firstAttr.priceAfterDiscount > 0
										? firstAttr.priceAfterDiscount
										: subPrice;

								// Build a sub-product
								const subProduct = {
									...product,
									productAttributes: attrList,
									subColorCode: colorCode,
									price: subPrice,
									priceAfterDiscount: subPriceAfterDiscount,
									quantity: colorTotalQty,
								};

								// If the attribute has images, use them; otherwise fallback
								const imagesToShow = firstAttr?.productImages?.length
									? firstAttr.productImages
									: product?.thumbnailImage?.[0]?.images || [];

								subProduct.displayImages = imagesToShow;

								// Store in unique map
								const key = `${product._id}-${colorCode}`;
								uniqueProductMap[key] = subProduct;
								return subProduct;
							});
						}

						// ==========================
						// 2) NON-POD PRODUCTS
						// ==========================
						if (productAttributes.length > 0) {
							// Expand by color, 1 card per color
							const uniqueAttributes = productAttributes.reduce((acc, attr) => {
								if (attr?.productImages?.length > 0 && !acc[attr.color]) {
									acc[attr.color] = {
										...product,
										productAttributes: [attr],
										thumbnailImage: product?.thumbnailImage,
									};
								}
								return acc;
							}, {});

							const subArray = Object.values(uniqueAttributes);
							subArray.forEach((subProd) => {
								const colorCode =
									subProd?.productAttributes?.[0]?.color || "default";
								const key = `${product._id}-${colorCode}`;
								uniqueProductMap[key] = subProd;
							});
							return subArray;
						} else {
							// Simple product
							uniqueProductMap[product._id] = product;
							return [product];
						}
					})
					.flat();

				// If the URL has ?category=..., optionally filter
				const params = new URLSearchParams(location.search);
				const categorySlug = params.get("category");
				const finalProducts = categorySlug
					? processed.filter((p) => p?.category?.categorySlug === categorySlug)
					: processed;

				setProducts(finalProducts);
				setTotalRecords(data?.totalRecords || 0);
				setColors(data?.colors || []);
				setSizes(data?.sizes || []);
				setCategories(data?.categories || []);
				setGenders(data?.genders || []);
				setPriceRange([
					data?.priceRange?.minPrice ?? 0,
					data?.priceRange?.maxPrice ?? 1000,
				]);
			}
		});
	}, [filters, page, records, location.search]);

	// 1) We only fetch products on filters/page changes
	useEffect(() => {
		fetchFilteredProducts();
	}, [filters, page, fetchFilteredProducts]);

	// 2) We only scroll to top once on initial mount
	useEffect(() => {
		const timer = window.setTimeout(() => {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}, 200);

		// Cleanup the timer when unmounting
		return () => {
			window.clearTimeout(timer);
		};
	}, []);

	// Update filters and reset page
	function handleFilterChange(key, value) {
		setFilters((prev) => ({
			...prev,
			[key]: value || "",
		}));
		setPage(1);
	}

	// Reset filters
	function resetFilters() {
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
	}

	// Retrieve color name
	function getColorNameFromHexa(hexa = "") {
		const colorObject = allColors.find((c) => c.hexa === hexa);
		return colorObject ? colorObject.color : hexa || "Unknown";
	}

	// Drawer controls
	function showDrawer() {
		setDrawerVisible(true);
	}
	function closeDrawer() {
		setDrawerVisible(false);
	}

	// Decide product link
	function getProductLink(product = {}) {
		if (product?.printifyProductDetails?.POD) {
			return `/custom-gifts/${product._id}`;
		}
		return `/single-product/${product?.slug || ""}/${
			product?.category?.categorySlug || ""
		}/${product?._id}`;
	}

	// (Optional) Transform images if using Cloudinary transformations
	// eslint-disable-next-line
	function getTransformedImageUrl(url = "", width, height) {
		if (!url) return "";
		const parts = url.split("upload/");
		const transformation = `upload/w_${width},h_${height},c_scale/`;
		return parts[0] + transformation + parts[1];
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
			{/* Helmet for SEO */}
			<ShopPageHelmet products={products} />

			<ShopPageMainOverallWrapper>
				<ShopPageMainWrapper>
					{/* ==================== DESKTOP FILTERS ==================== */}
					<FiltersSection>
						<Row gutter={[16, 16]}>
							<Col span={6}>
								<Select
									placeholder='Color'
									style={{ width: "100%" }}
									value={filters.color}
									onChange={(value) => handleFilterChange("color", value)}
								>
									<Option value=''>All Colors</Option>
									{colors.map((c, i) => (
										<Option key={i} value={c}>
											{getColorNameFromHexa(c)}
										</Option>
									))}
								</Select>
							</Col>

							<Col span={6}>
								<Select
									placeholder='Category'
									style={{ width: "100%" }}
									value={filters.category}
									onChange={(value) => handleFilterChange("category", value)}
								>
									<Option value=''>All Categories</Option>
									{categories.map((cat) => (
										<Option key={cat.id} value={cat.id}>
											{cat.name}
										</Option>
									))}
								</Select>
							</Col>

							<Col span={6}>
								<Select
									placeholder='Size'
									style={{ width: "100%" }}
									value={filters.size}
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
									value={filters.gender}
									onChange={(value) => handleFilterChange("gender", value)}
								>
									<Option value=''>All Genders</Option>
									{genders.map((g, i) => (
										<Option key={i} value={g.id}>
											{g.name}
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
									onChange={(val) => {
										handleFilterChange("priceMin", val[0]);
										handleFilterChange("priceMax", val[1]);
									}}
									tooltip={{ formatter: (val) => `$${val}` }}
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
									value={filters.searchTerm}
									onChange={(e) =>
										handleFilterChange("searchTerm", e.target.value)
									}
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

					{/* ==================== MOBILE FILTERS ==================== */}
					<SearchInputWrapper>
						<FiltersButton icon={<FilterOutlined />} onClick={showDrawer}>
							Filters
						</FiltersButton>
						<Search
							placeholder='Search'
							className='mx-2'
							value={filters.searchTerm}
							onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
							onSearch={(value) => handleFilterChange("searchTerm", value)}
						/>
					</SearchInputWrapper>

					{/* Replace "visible" with "open" to remove Drawer warning */}
					<FiltersDrawer
						title='Filters'
						placement='left'
						closable
						onClose={closeDrawer}
						open={drawerVisible}
					>
						<Row gutter={[16, 16]}>
							<Col span={24}>
								<Select
									placeholder='Color'
									style={{ width: "100%" }}
									value={filters.color}
									onChange={(val) => handleFilterChange("color", val)}
								>
									<Option value=''>All Colors</Option>
									{colors.map((c, i) => (
										<Option key={i} value={c}>
											{getColorNameFromHexa(c)}
										</Option>
									))}
								</Select>
							</Col>

							<Col span={24}>
								<Select
									placeholder='Category'
									style={{ width: "100%" }}
									value={filters.category}
									onChange={(val) => handleFilterChange("category", val)}
								>
									<Option value=''>All Categories</Option>
									{categories.map((cat) => (
										<Option key={cat.id} value={cat.id}>
											{cat.name}
										</Option>
									))}
								</Select>
							</Col>

							<Col span={24}>
								<Select
									placeholder='Size'
									style={{ width: "100%" }}
									value={filters.size}
									onChange={(val) => handleFilterChange("size", val)}
								>
									<Option value=''>All Sizes</Option>
									{sizes.map((size, i) => (
										<Option key={i} value={size}>
											{size}
										</Option>
									))}
								</Select>
							</Col>

							<Col span={24}>
								<Select
									placeholder='Gender'
									style={{ width: "100%" }}
									value={filters.gender}
									onChange={(val) => handleFilterChange("gender", val)}
								>
									<Option value=''>All Genders</Option>
									{genders.map((g, i) => (
										<Option key={i} value={g.id}>
											{g.name}
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
									onChange={(val) => {
										handleFilterChange("priceMin", val[0]);
										handleFilterChange("priceMax", val[1]);
									}}
									tooltip={{ formatter: (val) => `$${val}` }}
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

					{/* ==================== PRODUCT CARDS ==================== */}
					<ProductsSection>
						<Row gutter={[16, 16]}>
							{products.map((prod, idx) => {
								const isPOD = prod?.printifyProductDetails?.POD;

								// Use the sub-product's images if set (e.g., from color grouping)
								let productImages = [];
								if (prod?.displayImages) {
									productImages = prod.displayImages;
								} else if (
									prod?.thumbnailImage?.[0]?.images &&
									prod.thumbnailImage[0].images.length > 0
								) {
									productImages = prod.thumbnailImage[0].images;
								}

								const rawImageUrl =
									productImages?.[0]?.url ||
									"https://res.cloudinary.com/infiniteapps/image/upload/v1723694291/janat/default-image.jpg";

								// (2) Use Cloudinary Helper for WebP + fallback
								const webpUrl = getCloudinaryOptimizedUrl(rawImageUrl, {
									width: 600,
									forceWebP: true,
								});
								const fallbackUrl = getCloudinaryOptimizedUrl(rawImageUrl, {
									width: 600,
									forceWebP: false,
								});

								// Price logic
								const originalPrice = prod?.price || 0;
								const discountedPrice =
									prod?.priceAfterDiscount && prod.priceAfterDiscount > 0
										? prod.priceAfterDiscount
										: originalPrice;
								const discountPercentage =
									originalPrice > discountedPrice
										? Math.round(
												((originalPrice - discountedPrice) / originalPrice) *
													100
											)
										: 0;

								// Quantity
								const totalQty = prod?.quantity || 0;

								return (
									<Col xs={24} sm={12} md={12} lg={6} xl={6} key={idx}>
										<ProductCard
											hoverable
											cover={
												<ImageContainer>
													<BadgeContainer>
														{isPOD && <PodBadge>Custom Design</PodBadge>}
														{discountPercentage > 0 && (
															<DiscountBadge>
																{discountPercentage}% OFF
															</DiscountBadge>
														)}
													</BadgeContainer>

													{totalQty > 0 ? (
														<CartIcon
															onClick={(e) => {
																e.stopPropagation();
																ReactGA.event({
																	category: "Add To Cart",
																	action:
																		"User added product from Products Page",
																	label: `User added ${prod?.productName || "unknown"}`,
																});

																ReactPixel.track("AddToCart", {
																	// Standard Meta parameters:
																	content_name: prod.productName,
																	content_ids: [prod._id],
																	content_type: "product",
																	currency: "USD",
																	value: prod.priceAfterDiscount || prod.price, // the price you'd like to track

																	// Optionally, you could pass `contents`:
																	contents: [
																		{
																			id: prod._id,
																			quantity: 1,
																		},
																	],
																});

																readProduct(prod?._id).then((res) => {
																	if (res?.error) {
																		console.log(res.error);
																	} else {
																		openSidebar2();
																		// pick the first attribute if you want
																		const chosenAttr =
																			prod?.productAttributes?.[0] || null;
																		addToCart(
																			prod?._id,
																			null,
																			1,
																			res,
																			chosenAttr
																		);
																	}
																});
															}}
														/>
													) : (
														<OutOfStockBadge>Out of Stock</OutOfStockBadge>
													)}

													<picture>
														<source srcSet={webpUrl} type='image/webp' />
														<ProductImage
															src={fallbackUrl}
															alt={prod?.productName || "Product Image"}
															onClick={() => {
																ReactGA.event({
																	category: "Single Product Clicked",
																	action:
																		"User Navigated To Single Product From Products Page",
																	label: `User viewed ${prod?.productName || "unknown"}`,
																});

																ReactPixel.track(
																	"Single Product Clicked From Shop Page",
																	{
																		action: `User viewed ${prod?.productName || "unknown"}`,
																		page: "Shop Page",
																	}
																);

																window.scrollTo({ top: 0, behavior: "smooth" });
																history.push(getProductLink(prod));
															}}
														/>
													</picture>
												</ImageContainer>
											}
										>
											<Meta
												title={prod?.productName || "Untitled Product"}
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
											{isPOD && (
												<CursiveText>
													Your Loved Ones Deserve 3 Minutes From Your Time To
													Customize Their Present!
												</CursiveText>
											)}
										</ProductCard>
									</Col>
								);
							})}
						</Row>

						{/* Pagination */}
						<PaginationWrapper
							onClick={() => {
								window.scrollTo({ top: 0, behavior: "smooth" });
							}}
						>
							<Pagination
								current={page}
								pageSize={records}
								onChange={(pg) => setPage(pg)}
								total={totalRecords}
							/>
						</PaginationWrapper>
					</ProductsSection>
				</ShopPageMainWrapper>
			</ShopPageMainOverallWrapper>
		</ConfigProvider>
	);
}

export default ShopPageMain;

/* ============================= STYLES ============================= */

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

/* Replaced "visible" with "open" to avoid the Drawer warning */
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
	max-height: 640px;
	transition: var(--main-transition);
	text-transform: capitalize;

	&:hover {
		transform: translateY(-10px);
		box-shadow: var(--box-shadow-light);
	}

	@media (max-width: 700px) {
		min-height: 600px;
		max-height: 640px;
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
