import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { FaTimes, FaTrashAlt } from "react-icons/fa";
import { useCartContext } from "../cart_context";
import { Link } from "react-router-dom";
import { getColors } from "../apiCore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactGA from "react-ga4";
import { Modal } from "antd";

/* Keyframe animations */
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
	const [modalItem, setModalItem] = useState(null); // For optional product-image popup

	// Fetch color data once
	useEffect(() => {
		getColors().then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setAllColors(data);
			}
		});
	}, []);

	// Check stock availability
	const checkingAvailability = cart.map((item) => {
		const product = item.allProductDetailsIncluded || {};
		const productAttrs = product.productAttributes || [];

		// If local variations exist
		const chosenAttr = productAttrs.find(
			(attr) => attr.color === item.color && attr.size === item.size
		);

		if (productAttrs.length > 0 && chosenAttr) {
			return (
				product.activeProduct &&
				chosenAttr.quantity >= item.amount &&
				item.amount > 0
			);
		} else {
			// No local variant => compare to product.quantity
			return (
				product.activeProduct &&
				product.quantity >= item.amount &&
				item.amount > 0
			);
		}
	});

	const isStockAvailable = checkingAvailability.every(Boolean);

	const handleClickImage = (item) => {
		// show modal
		setModalItem(item);
	};

	return (
		<>
			<ToastContainer className='toast-top-center' position='top-center' />

			{/* Overlay behind cart sidebar */}
			{isSidebarOpen2 && <Overlay onClick={() => closeSidebar2()} />}

			<CartWrapper $isOpen={isSidebarOpen2} $fromPage={from === "NavbarBottom"}>
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
							const product = item.allProductDetailsIncluded || {};
							const productAttrs = product.productAttributes || [];

							const uniqueProductColors = [
								...new Set(productAttrs.map((attr) => attr.color)),
							];
							const uniqueProductSizes = [
								...new Set(productAttrs.map((attr) => attr.size)),
							];

							// find the chosen attribute
							const chosenAttr = productAttrs.find(
								(attr) => attr.color === item.color && attr.size === item.size
							);
							const maxQuantity = chosenAttr
								? chosenAttr.quantity
								: product.quantity || item.max;

							// out-of-stock check
							const isItemOutOfStock =
								(!product.activeBackorder &&
									chosenAttr &&
									chosenAttr.quantity < item.amount) ||
								product.quantity <= 0;

							// if it's a Printify POD item, we often disable color/size changes
							const isPodProduct =
								item.isPrintifyProduct &&
								product.printifyProductDetails?.POD === true;

							return (
								<CartItem key={i}>
									<ItemImage
										src={item.image}
										alt={item.name}
										onClick={() => handleClickImage(item)}
									/>

									<ItemDetails>
										<ItemName>{item.name}</ItemName>

										{isItemOutOfStock && (
											<OutOfStockMessage>Out Of Stock</OutOfStockMessage>
										)}

										{/* Quantity +/- */}
										<QuantityWrapper>
											<QuantityButton
												onClick={() =>
													toggleAmount(
														item.id,
														"dec",
														item.chosenProductAttributes,
														maxQuantity
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
														maxQuantity
													)
												}
											>
												+
											</QuantityButton>
										</QuantityWrapper>

										<ItemPrice>Price: ${item.priceAfterDiscount}</ItemPrice>
										<ItemTotal>
											Item Total: $
											{(item.priceAfterDiscount * item.amount).toFixed(2)}
										</ItemTotal>

										{/* If the product has variations => color/size */}
										{item.chosenProductAttributes &&
											productAttrs.length > 0 && (
												<AttributeWrapper>
													{/* ========== COLOR SELECT ========== */}
													{uniqueProductColors.length > 0 &&
														(isPodProduct && item.customDesign ? (
															/* If it's a POD item with a custom design => single disabled option */
															<AttributeSelect
																disabled
																style={{ color: "grey" }}
																value={
																	item.customDesign.variants?.color?.title ||
																	item.customDesign.color ||
																	item.color
																}
															>
																<option
																	value={
																		item.customDesign.variants?.color?.title ||
																		item.customDesign.color ||
																		item.color
																	}
																>
																	{item.customDesign.variants?.color?.title ||
																		item.customDesign.color ||
																		item.color}
																</option>
															</AttributeSelect>
														) : (
															/* Normal color select logic */
															<AttributeSelect
																disabled={isPodProduct}
																style={{
																	color: isPodProduct ? "grey" : "inherit",
																}}
																value={item.color}
																onChange={(e) => {
																	if (!isPodProduct) {
																		const newColor = e.target.value;
																		const newChosenAttr = productAttrs.find(
																			(a) =>
																				a.color.toLowerCase() ===
																					newColor.toLowerCase() &&
																				a.size.toLowerCase() ===
																					item.size.toLowerCase()
																		);
																		const chosenColorImage =
																			newChosenAttr?.productImages?.[0]?.url ||
																			item.image;
																		const newQuantity =
																			newChosenAttr?.quantity || 0;
																		changeColor(
																			item.id,
																			newColor,
																			item.size,
																			chosenColorImage,
																			newQuantity,
																			item.color
																		);
																	}
																}}
															>
																{uniqueProductColors.map((colorVal, ii) => {
																	// Attempt to match color name from allColors
																	const foundColorObj = allColors.find(
																		(clr) => clr.hexa === colorVal
																	);
																	const colorName = foundColorObj
																		? foundColorObj.color
																		: colorVal;
																	return (
																		<option key={ii} value={colorVal}>
																			{colorName}
																		</option>
																	);
																})}
															</AttributeSelect>
														))}

													{/* ========== SIZE SELECT ========== */}
													{uniqueProductSizes[0] !== "nosizes" &&
														uniqueProductSizes.length > 0 &&
														(isPodProduct && item.customDesign ? (
															/* POD w/ custom design => single disabled option */
															<AttributeSelect
																disabled
																style={{ color: "grey" }}
																value={
																	item.customDesign.variants?.size?.title ||
																	item.customDesign.size ||
																	item.size
																}
															>
																<option
																	value={
																		item.customDesign.variants?.size?.title ||
																		item.customDesign.size ||
																		item.size
																	}
																>
																	{item.customDesign.variants?.size?.title ||
																		item.customDesign.size ||
																		item.size}
																</option>
															</AttributeSelect>
														) : (
															/* Normal size select */
															<AttributeSelect
																disabled={isPodProduct}
																style={{
																	color: isPodProduct ? "grey" : "inherit",
																}}
																value={item.size}
																onChange={(e) => {
																	if (!isPodProduct) {
																		const newSize = e.target.value;
																		const newChosenAttr = productAttrs.find(
																			(a) =>
																				a.size.toLowerCase() ===
																					newSize.toLowerCase() &&
																				a.color.toLowerCase() ===
																					item.color.toLowerCase()
																		);
																		const newQuantity =
																			newChosenAttr?.quantity || 0;
																		changeSize(
																			item.id,
																			newSize,
																			item.color,
																			newQuantity,
																			item.size
																		);
																	}
																}}
															>
																{uniqueProductSizes.map((sz, iii) => (
																	<option key={iii} value={sz}>
																		{sz}
																	</option>
																))}
															</AttributeSelect>
														))}
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
							Total Amount: ${Number(total_amount).toFixed(2)}
							<hr className='col-md-6' />
						</TotalAmount>
					)}

					{cart.length > 0 && (
						<ButtonsWrapper>
							<CheckoutButton
								to='/cart'
								onClick={() => {
									if (isStockAvailable) {
										window.scrollTo({ top: 0, behavior: "smooth" });
										closeSidebar2();
										ReactGA.event({
											category: "Continue To Checkout",
											action: "User Clicked Continue To Checkout From Cart",
										});
									} else {
										// find out-of-stock items
										const outOfStockItems = cart.filter(
											(item, index) => !checkingAvailability[index]
										);
										outOfStockItems.forEach((itm) => {
											toast.error(
												`Please remove product ${itm.name} so you can checkout`
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
			</CartWrapper>

			{/* Optional product-image modal */}
			<Modal
				open={!!modalItem}
				onCancel={() => setModalItem(null)}
				footer={null}
				title={null}
				closable={true}
				centered
				// Instead of bodyStyle, use the new 'styles' prop
				styles={{
					body: {
						padding: "10px",
						textAlign: "center",
					},
				}}
				maskClosable
				width='auto'
				zIndex={9999}
			>
				{modalItem && (
					<img
						src={modalItem.image}
						alt={modalItem.name}
						style={{
							maxWidth: "90vw",
							maxHeight: "70vh",
							objectFit: "contain",
						}}
					/>
				)}
			</Modal>
		</>
	);
};

export default SidebarCart;

/* -------------- STYLED COMPONENTS -------------- */

/* Overlay behind the cart sidebar */
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

/* CartWrapper with $ prop to avoid warnings */
const CartWrapper = styled.div`
	position: fixed;
	top: 0;
	right: 0;
	width: ${(props) => (props.$fromPage ? "400px" : "300px")};
	height: 100vh;
	background: var(--background-light);
	padding: 20px;
	transform: translateX(${(props) => (props.$isOpen ? "0" : "100%")});
	transition: transform 0.3s ease;
	z-index: 1500;
	display: flex;
	flex-direction: column;
	align-items: center;
	animation: ${(props) =>
		props.$isOpen
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
	cursor: pointer;
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

const OutOfStockMessage = styled.p`
	color: red;
	font-weight: bold;
	margin-top: 5px;
	font-size: 12px;
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

	&:disabled {
		background-color: #ebebeb;
		cursor: not-allowed;
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

const CheckoutButton = styled(Link)`
	margin-top: 10px;
	padding: 10px 40px;
	background: var(--primary-color-dark);
	color: var(--neutral-light);
	border: none;
	font-size: 14px;
	transition: var(--main-transition);
	border-radius: 5px;
	cursor: pointer;
	text-align: center;

	&:hover {
		background: var(--primary-color-darker);
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
