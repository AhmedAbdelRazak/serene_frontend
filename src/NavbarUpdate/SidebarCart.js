import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { FaTimes, FaTrashAlt } from "react-icons/fa";
import { useCartContext } from "../cart_context";
import { useHistory } from "react-router-dom";
import { getColors } from "../apiCore";

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

	var checkingAvailability = [];

	return (
		<>
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
							var productColors =
								item.allProductDetailsIncluded.productAttributes.map(
									(iii) => iii.color
								);
							var uniqueProductColors = [
								...new Map(productColors.map((item) => [item, item])).values(),
							];

							var productSizes =
								item.allProductDetailsIncluded.productAttributes.map(
									(iii) => iii.size
								);
							var uniqueProductSizes = [
								...new Map(productSizes.map((item) => [item, item])).values(),
							];

							var chosenAttribute =
								item.allProductDetailsIncluded.productAttributes.filter(
									(iii) => iii.color === item.color && iii.size === item.size
								)[0];

							if (item.allProductDetailsIncluded.activeBackorder) {
								checkingAvailability.push(true);
							} else {
								checkingAvailability.push(
									chosenAttribute && chosenAttribute.quantity >= item.amount
								);
							}

							return (
								<CartItem key={i}>
									<ItemImage src={item.image} alt={item.name} />
									<ItemDetails>
										<ItemName>{item.name}</ItemName>
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
														var chosenColorImageHelper =
															item.allProductDetailsIncluded.productAttributes.filter(
																(iii) => iii.color === e.target.value
															)[0];

														var chosenColorImage =
															chosenColorImageHelper &&
															chosenColorImageHelper.productImages &&
															chosenColorImageHelper.productImages[0] &&
															chosenColorImageHelper.productImages[0].url;

														var chosenAttribute2 =
															item.allProductDetailsIncluded.productAttributes.filter(
																(iii) =>
																	iii.color.toLowerCase() ===
																		e.target.value.toLowerCase() &&
																	iii.size.toLowerCase() === item.size
															)[0];
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
													{uniqueProductColors &&
														uniqueProductColors.map((cc, ii) => {
															return (
																<option key={ii} value={cc}>
																	{allColors &&
																		allColors[
																			allColors.map((ii) => ii.hexa).indexOf(cc)
																		] &&
																		allColors[
																			allColors.map((ii) => ii.hexa).indexOf(cc)
																		].color}
																</option>
															);
														})}
												</AttributeSelect>
												{uniqueProductSizes &&
												uniqueProductSizes &&
												uniqueProductSizes.length > 0 &&
												uniqueProductSizes[0] !== "nosizes" ? (
													<AttributeSelect
														value={item.size}
														onChange={(e) => {
															var chosenAttribute2 =
																item.allProductDetailsIncluded.productAttributes.filter(
																	(iii) =>
																		iii.size.toLowerCase() ===
																		e.target.value.toLowerCase()
																)[0];

															changeSize(
																item.id,
																e.target.value,
																item.color,
																chosenAttribute2.quantity,
																item.size
															);
														}}
													>
														{uniqueProductSizes &&
															uniqueProductSizes.map((ss, iii) => {
																return (
																	<option key={iii} value={ss}>
																		{ss}
																	</option>
																);
															})}
													</AttributeSelect>
												) : null}
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
							Total Amount: ${total_amount} <hr className='col-md-6' />
						</TotalAmount>
					)}
					{cart.length > 0 && (
						<ButtonsWrapper>
							<CheckoutButton
								onClick={() => {
									window.scrollTo({ top: 50, behavior: "smooth" });
									closeSidebar2();
									handleCheckout();
								}}
							>
								Continue To Check Out
							</CheckoutButton>
							<ClearCartButton onClick={clearCart}>Clear Cart</ClearCartButton>
						</ButtonsWrapper>
					)}
				</CartContent>
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

	&:hover {
		border-color: var(--border-color-light);
	}
`;

const RemoveButton = styled.button`
	position: absolute;
	right: 0;
	top: 0;
	background: none;
	border: none;
	color: var(--secondary-color);
	font-size: 18px;
	cursor: pointer;

	&:hover {
		color: var(--secondary-color-dark);
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
