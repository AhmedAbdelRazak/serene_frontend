import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { FaTimes, FaTrashAlt } from "react-icons/fa";
import { useCartContext } from "../cart_context";
import { useHistory } from "react-router-dom";
import { getColors } from "../apiCore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Add this import
import ReactGA from "react-ga4";

const SidebarCart = ({ from }) => {
	const {
		closeSidebar2,
		isSidebarOpen2,
		cart,
		toggleAmount,
		changeColor,
		changeSize,
		removeItem,
		clearCart,
		total_amount,
	} = useCartContext();
	const [allColors, setAllColors] = useState([]);
	const history = useHistory();

	const handleCheckout = () => {
		history.push("/cart");
	};

	useEffect(() => {
		getColors().then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setAllColors(data);
			}
		});
	}, []);

	const checkingAvailability = cart.map((item) => {
		// Check if the product has attributes
		const hasAttributes =
			item.allProductDetailsIncluded.productAttributes &&
			item.allProductDetailsIncluded.productAttributes.length > 0;

		// Find the chosen attribute if it exists
		const chosenAttribute = hasAttributes
			? item.allProductDetailsIncluded.productAttributes.find(
					(attr) => attr.color === item.color && attr.size === item.size
				)
			: null;

		// Log details for debugging
		console.log("Item:", item.name);
		console.log("Has Attributes:", hasAttributes);
		console.log("Chosen Attribute:", chosenAttribute);
		console.log(
			"Active Product:",
			item.allProductDetailsIncluded.activeProduct
		);
		console.log(
			"Active Backorder:",
			item.allProductDetailsIncluded.activeBackorder
		);
		console.log(
			"Chosen Attribute Quantity:",
			chosenAttribute ? chosenAttribute.quantity : "N/A"
		);
		console.log("Item Amount:", item.amount);
		console.log("Product Quantity:", item.allProductDetailsIncluded.quantity);

		// Determine availability based on attributes or directly on the product
		if (hasAttributes) {
			return (
				item.allProductDetailsIncluded.activeProduct &&
				chosenAttribute &&
				chosenAttribute.quantity >= item.amount &&
				item.amount > 0
			);
		} else {
			return (
				item.allProductDetailsIncluded.activeProduct &&
				item.allProductDetailsIncluded.quantity >= item.amount &&
				item.amount > 0
			);
		}
	});

	const isStockAvailable = checkingAvailability.every(Boolean);

	return (
		<>
			<ToastContainer className='toast-top-center' position='top-center' />{" "}
			{isSidebarOpen2 && <Overlay onClick={() => closeSidebar2()} />}
			<CartWrapper isOpen={isSidebarOpen2} fromPage={from === "NavbarBottom"}>
				<CloseIcon onClick={() => closeSidebar2()} />
				<CartContent>
					{cart.length === 0 ? (
						<p
							style={{
								fontSize: "1.3rem",
								color: "darkred",
								textAlign: "center",
								fontWeight: "bold",
								marginTop: "50px",
							}}
						>
							Your cart is currently empty
						</p>
					) : (
						cart.map((item, i) => {
							const productColors =
								item.allProductDetailsIncluded.productAttributes.map(
									(attr) => attr.color
								);
							const uniqueProductColors = [...new Set(productColors)];

							const productSizes =
								item.allProductDetailsIncluded.productAttributes.map(
									(attr) => attr.size
								);
							const uniqueProductSizes = [...new Set(productSizes)];

							const chosenAttribute =
								item.allProductDetailsIncluded.productAttributes.find(
									(attr) => attr.color === item.color && attr.size === item.size
								);

							const isItemOutOfStock =
								(!item.allProductDetailsIncluded.activeBackorder &&
									chosenAttribute &&
									chosenAttribute.quantity < item.amount) ||
								item.allProductDetailsIncluded.quantity <= 0;

							return (
								<CartItem key={i}>
									<ItemImage src={item.image} alt={item.name} />
									<ItemDetails>
										<ItemName>{item.name}</ItemName>
										{isItemOutOfStock && (
											<OutOfStockMessage>Out Of Stock</OutOfStockMessage>
										)}
										<QuantityWrapper>
											<QuantityButton
												onClick={() =>
													toggleAmount(
														item.id,
														"dec",
														item.chosenProductAttributes,
														item.max
													)
												}
											>
												-
											</QuantityButton>
											<ItemQuantity>{item.amount}</ItemQuantity>
											<QuantityButton
												onClick={() =>
													toggleAmount(
														item.id,
														"inc",
														item.chosenProductAttributes,
														item.max
													)
												}
											>
												+
											</QuantityButton>
										</QuantityWrapper>
										<ItemPrice>Price: ${item.priceAfterDiscount}</ItemPrice>
										<ItemTotal>
											Item Total: ${item.priceAfterDiscount * item.amount}
										</ItemTotal>
										{item.chosenProductAttributes && (
											<AttributeWrapper>
												<AttributeSelect
													value={item.color}
													onChange={(e) => {
														const chosenColorImageHelper =
															item.allProductDetailsIncluded.productAttributes.find(
																(attr) => attr.color === e.target.value
															);

														const chosenColorImage =
															chosenColorImageHelper?.productImages?.[0]?.url;

														const chosenAttribute2 =
															item.allProductDetailsIncluded.productAttributes.find(
																(attr) =>
																	attr.color.toLowerCase() ===
																		e.target.value.toLowerCase() &&
																	attr.size.toLowerCase() ===
																		item.size.toLowerCase()
															);
														changeColor(
															item.id,
															e.target.value,
															item.size,
															chosenColorImage,
															chosenAttribute2.quantity,
															item.color
														);
													}}
												>
													{uniqueProductColors.map((color, ii) => (
														<option key={ii} value={color}>
															{
																allColors.find((clr) => clr.hexa === color)
																	?.color
															}
														</option>
													))}
												</AttributeSelect>
												{uniqueProductSizes[0] !== "nosizes" && (
													<AttributeSelect
														value={item.size}
														onChange={(e) => {
															const chosenAttribute2 =
																item.allProductDetailsIncluded.productAttributes.find(
																	(attr) =>
																		attr.size.toLowerCase() ===
																		e.target.value.toLowerCase()
																);

															changeSize(
																item.id,
																e.target.value,
																item.color,
																chosenAttribute2.quantity,
																item.size
															);
														}}
													>
														{uniqueProductSizes.map((size, iii) => (
															<option key={iii} value={size}>
																{size}
															</option>
														))}
													</AttributeSelect>
												)}
											</AttributeWrapper>
										)}
										<RemoveButton
											onClick={() => removeItem(item.id, item.size, item.color)}
										>
											<FaTrashAlt />
										</RemoveButton>
									</ItemDetails>
								</CartItem>
							);
						})
					)}
					{cart.length > 0 && (
						<TotalAmount>
							Total Amount: ${Number(total_amount).toFixed(2)}{" "}
							<hr className='col-md-6' />
						</TotalAmount>
					)}
					{cart.length > 0 && (
						<ButtonsWrapper>
							<CheckoutButton
								onClick={() => {
									if (isStockAvailable) {
										window.scrollTo({ top: 50, behavior: "smooth" });
										closeSidebar2();
										handleCheckout();
										ReactGA.event({
											category: "Continue To Checkout",
											action: "User Clicked Continue To Checkout From Cart",
										});
									} else {
										const outOfStockItems = cart.filter(
											(item, index) => !checkingAvailability[index]
										);
										outOfStockItems.forEach((item) => {
											toast.error(
												`Please remove product ${item.name} so you can checkout`
											);
										});
									}
								}}
							>
								{isStockAvailable
									? "Continue To Check Out"
									: "No Stock Available"}
							</CheckoutButton>
							<ClearCartButton onClick={clearCart}>Clear Cart</ClearCartButton>
						</ButtonsWrapper>
					)}
				</CartContent>
				{/* Add this */}
			</CartWrapper>
		</>
	);
};

export default SidebarCart;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
`;

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	z-index: 5;
	animation: ${fadeIn} 0.3s ease-in-out;
`;

const CartWrapper = styled.div`
	position: fixed;
	top: 0;
	right: 0;
	width: ${(props) => (props.fromPage ? "400px" : "300px")};
	height: 100vh;
	background: var(--background-light);
	padding: 20px;
	transform: translateX(${(props) => (props.isOpen ? "0" : "100%")});
	transition: transform 0.3s ease;
	z-index: 1500;
	display: flex;
	flex-direction: column;
	align-items: center;
	animation: ${(props) =>
		props.isOpen
			? css`
					${fadeIn} 0.3s ease forwards
				`
			: css`
					${fadeOut} 0.3s ease forwards
				`};

	overflow-y: auto;
`;

const CloseIcon = styled(FaTimes)`
	position: absolute;
	top: 10px;
	right: 10px;
	cursor: pointer;
	color: var(--text-color-dark);
	font-size: 24px;

	@media (max-width: 900px) {
		right: 20px;
	}
`;

const CartContent = styled.div`
	width: 100%;
	margin-top: 50px;
	font-size: 18px;
	color: var(--text-color-dark);
`;

const CartItem = styled.div`
	display: flex;
	align-items: center;
	margin-bottom: 15px;
	border-bottom: 1px solid var(--border-color-dark);
	padding-bottom: 15px;
`;

const ItemImage = styled.img`
	width: 80px;
	height: 80px;
	object-fit: cover;
	border-radius: 8px;
	margin-right: 15px;
`;

const ItemDetails = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	width: 100%;
	position: relative;
`;

const ItemName = styled.p`
	font-weight: bold;
	margin-bottom: 5px;
	text-transform: capitalize;
	font-size: 0.9rem;
`;

const QuantityWrapper = styled.div`
	display: flex;
	align-items: center;
	margin-bottom: 10px;
	font-size: 0.9rem;
`;

const QuantityButton = styled.button`
	background: var(--neutral-medium);
	border: none;
	padding: 5px 10px;
	cursor: pointer;
	font-size: 0.9rem;

	&:hover {
		background: var(--neutral-dark);
		color: var(--neutral-light);
	}
`;

const ItemQuantity = styled.p`
	margin: 0 10px;
	font-size: 0.9rem;
	font-weight: bold;
`;

const ItemPrice = styled.p`
	font-weight: bold;
	color: var(--primary-color);
	font-size: 0.9rem;
`;

const ItemTotal = styled.p`
	font-weight: bold;
	color: var(--primary-color);
	font-size: 0.9rem;
	margin-top: 5px;
`;

const AttributeWrapper = styled.div`
	display: flex;
	align-items: center;
	margin-top: 10px;
`;

const AttributeSelect = styled.select`
	margin-right: 10px;
	padding: 5px;
	border: 1px solid var(--border-color-dark);
	border-radius: 5px;
	cursor: pointer;
	max-width: 80% !important;
	text-transform: capitalize;
	font-size: 14px;

	&:hover {
		border-color: var(--border-color-light);
	}

	@media (max-width: 900px) {
		max-width: 80% !important;
	}
`;

const RemoveButton = styled.button`
	position: absolute;
	right: 50px;
	top: 20px;
	background: none;
	border: none;
	color: var(--secondary-color);
	font-size: 18px;
	cursor: pointer;

	&:hover {
		color: var(--secondary-color-dark);
	}

	@media (max-width: 900px) {
		right: 50px;
		top: 20px;
	}
`;

const ClearCartButton = styled.button`
	margin-top: 30px;
	padding: 10px 20px;
	background: var(--secondary-color-dark);
	color: var(--neutral-light);
	border: none;
	font-size: 14px;
	transition: var(--main-transition);
	border-radius: 5px;
	cursor: pointer;

	&:hover {
		background: var(--secondary-color-darker);
	}
`;

const TotalAmount = styled.div`
	margin-top: 20px;
	font-size: 1.2rem;
	font-weight: bold;
	color: var(--primary-color);
	text-align: center;
`;

const ButtonsWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	margin-top: 10px;
`;

const CheckoutButton = styled.button`
	margin-top: 10px;
	padding: 10px 40px;
	background: var(--primary-color-dark);
	color: var(--neutral-light);
	border: none;
	font-size: 14px;
	transition: var(--main-transition);
	border-radius: 5px;
	cursor: pointer;

	&:hover {
		background: var(--primary-color-darker);
	}
`;

const OutOfStockMessage = styled.p`
	color: red;
	font-weight: bold;
	margin-top: 5px;
	font-size: 12px;
`;
