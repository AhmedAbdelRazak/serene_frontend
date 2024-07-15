import React, { useEffect, useState } from "react";
import { FaTrashAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Collapse } from "antd";
import { useCartContext } from "../../cart_context";
import styled from "styled-components";
import { getColors } from "../../apiCore"; // Ensure the path is correct

const { Panel } = Collapse;

const Z1CartDetails = ({ appliedCoupon, goodCoupon }) => {
	const {
		cart,
		total_amount,
		removeItem,
		clearCart,
		toggleAmount,
		changeColor,
		changeSize,
		// eslint-disable-next-line
		shipmentChosen,
	} = useCartContext();
	const [allColors, setAllColors] = useState([]);

	useEffect(() => {
		// Fetch all available colors
		getColors().then((data) => {
			if (data.error) {
				console.log(data.error);
			} else {
				setAllColors(data);
			}
		});
	}, []);

	const totalAmountAdjusted = goodCoupon
		? (
				total_amount -
				Number(total_amount) * (appliedCoupon.discount / 100)
			).toFixed(2)
		: total_amount;

	return (
		<>
			<Collapse
				expandIconPosition='right'
				bordered={false}
				expandIcon={({ isActive }) =>
					isActive ? <FaChevronUp /> : <FaChevronDown />
				}
			>
				<Panel header='Cart Details' key='1'>
					<CartItems>
						{cart.map((item, i) => {
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
															chosenAttribute2?.quantity,
															item.color
														);
													}}
												>
													{uniqueProductColors.map((cc, ii) => {
														const colorName = allColors.find(
															(color) => color.hexa === cc
														)?.color;
														return (
															<option key={ii} value={cc}>
																{colorName || cc}
															</option>
														);
													})}
												</AttributeSelect>
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
															chosenAttribute2?.quantity,
															item.size
														);
													}}
												>
													{uniqueProductSizes.map((ss, ii) => (
														<option key={ii} value={ss}>
															{ss}
														</option>
													))}
												</AttributeSelect>
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
						})}
						<TotalAmount>
							{goodCoupon ? (
								<>
									<DiscountedTotal>
										Total Amount:{" "}
										<s style={{ color: "red" }}>
											${Number(total_amount).toFixed(2)}
										</s>
										<DiscountedPrice>${totalAmountAdjusted}</DiscountedPrice>
									</DiscountedTotal>
								</>
							) : (
								`Total Amount: $${Number(total_amount).toFixed(2)}`
							)}
							<hr className='col-md-6' />
						</TotalAmount>
						<ClearCartButton onClick={clearCart}>Clear Cart</ClearCartButton>
					</CartItems>
				</Panel>
			</Collapse>
		</>
	);
};

export default Z1CartDetails;

const CartItems = styled.div`
	margin-top: 20px;
`;

const CartItem = styled.div`
	display: flex;
	align-items: center;
	margin-bottom: 15px;
	border-bottom: 1px solid #ccc;
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
	background: #ddd;
	border: none;
	padding: 5px 10px;
	cursor: pointer;
	font-size: 0.9rem;
	&:hover {
		background: #ccc;
	}
`;

const ItemQuantity = styled.p`
	margin: 0 10px;
	font-size: 0.9rem;
	font-weight: bold;
`;

const ItemPrice = styled.p`
	font-weight: bold;
	color: #0c1d2d;
	font-size: 0.9rem;
`;

const ItemTotal = styled.p`
	font-weight: bold;
	color: #0c1d2d;
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
	border: 1px solid #ccc;
	border-radius: 5px;
	cursor: pointer;
	&:hover {
		border-color: #888;
	}
`;

const RemoveButton = styled.button`
	position: absolute;
	right: 0;
	top: 0;
	background: none;
	border: none;
	color: red;
	font-size: 18px;
	cursor: pointer;
	&:hover {
		color: darkred;
	}
`;

const TotalAmount = styled.div`
	margin-top: 20px;
	font-size: 1.2rem;
	font-weight: bold;
	color: #0c1d2d;
	text-align: center;
`;

const ClearCartButton = styled.button`
	padding: 10px 20px;
	background: #4c1414;
	color: white;
	border: none;
	font-size: 14px;
	transition: 0.3s;
	width: 25%;
	border-radius: 5px;
	cursor: pointer;
	&:hover {
		background: darkred;
	}
	@media (max-width: 768px) {
		width: 100%;
	}
`;

const DiscountedTotal = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 1.2rem;
	font-weight: bold;
	color: #0c1d2d;
`;

const DiscountedPrice = styled.span`
	margin-left: 10px;
	font-weight: bold;
`;
