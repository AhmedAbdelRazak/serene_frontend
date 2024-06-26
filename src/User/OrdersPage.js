import React from "react";
import styled from "styled-components";
import {
	FaBoxOpen,
	FaDollarSign,
	FaReceipt,
	FaTruck,
	FaCalendarAlt,
} from "react-icons/fa";

const OrdersPage = ({ orders }) => {
	return (
		<OrdersWrapper>
			{orders.map((order) => (
				<OrderCard key={order.invoiceNumber}>
					<CardTitle>Invoice Number: {order.invoiceNumber}</CardTitle>
					<CardContent>
						<Title>Your Orders</Title>
						<div className='col-md-5'>
							<StyledText>
								<FaCalendarAlt style={{ marginRight: "5px" }} />
								<strong>Order Date:</strong>{" "}
								{new Date(order.orderCreationDate).toLocaleDateString()}{" "}
								{new Date(order.orderCreationDate).toLocaleTimeString()}
							</StyledText>
							<StyledText>
								<FaTruck style={{ marginRight: "5px" }} />
								<strong>Tracking Number:</strong>{" "}
								{order.trackingNumber || "No Tracking # Yet"}
							</StyledText>

							<div className='row'>
								<div className='col-md-6'>
									<span>
										<FaBoxOpen style={{ marginRight: "5px" }} />
										<strong>Shipment Status:</strong> {order.status}
									</span>
								</div>

								<div className='col-md-6'>
									<span>
										<FaDollarSign style={{ marginRight: "5px" }} />
										<strong>Payment Status:</strong>{" "}
										{order.paymentDetails.payment.status.toLowerCase() ===
										"completed"
											? "Paid"
											: "Not Paid"}
									</span>
								</div>

								<div className='col-md-6'>
									<span>
										<FaReceipt style={{ marginRight: "5px" }} />
										<strong>Order Amount:</strong> $
										{(order.totalAmount - order.shippingFees).toFixed(2)}
									</span>
								</div>

								<div className='col-md-6'>
									<span>
										<FaDollarSign style={{ marginRight: "5px" }} />
										<strong>Shipping Fees:</strong> ${order.shippingFees}
									</span>
								</div>
							</div>

							<CenteredText>
								<strong>Total Amount:</strong> ${order.totalAmount}
							</CenteredText>
							<SectionTitle>Payment Details</SectionTitle>

							<div className='row'>
								<div className='col-md-4'>
									<StyledText>
										<FaReceipt style={{ marginRight: "5px" }} />
										<strong>TransactionId:</strong>{" "}
										{order.paymentDetails.payment.receiptNumber}
									</StyledText>
								</div>

								<div className='col-md-4'>
									<StyledText>
										<span style={{ marginLeft: "10px" }}>
											<strong>Last4:</strong>{" "}
											{order.paymentDetails.payment.cardDetails.card.last4}
										</span>
									</StyledText>
								</div>

								<div className='col-md-4'>
									<StyledText>
										<span style={{ marginLeft: "10px" }}>
											<strong>Expiry Date:</strong>{" "}
											{order.paymentDetails.payment.cardDetails.card.expMonth}/
											{order.paymentDetails.payment.cardDetails.card.expYear}
										</span>
									</StyledText>
								</div>
							</div>
						</div>

						<SectionTitle>Products</SectionTitle>
						{order.productsNoVariable.map((product) => (
							<ProductWrapper key={product.name}>
								<ProductImage src={product.image} alt={product.name} />
								<ProductDetails>
									<StyledText>
										<strong>Product Name:</strong> {product.name}
										<span style={{ marginLeft: "20px" }}>
											<strong>Ordered Quantity:</strong>{" "}
											{product.ordered_quantity}
										</span>
										<span style={{ marginLeft: "20px" }}>
											<strong>Price/Unit:</strong> ${product.price}
										</span>
									</StyledText>
									<StyledText>
										<strong>SKU:</strong> {product.sku}
										<span style={{ marginLeft: "20px" }}>
											<strong>Color:</strong> {product.color}
										</span>
										<span style={{ marginLeft: "20px" }}>
											<strong>Size:</strong> {product.size}
										</span>
									</StyledText>
									<StyledText>
										<strong>Total Amount:</strong> $
										{(product.ordered_quantity * product.price).toFixed(2)}
									</StyledText>
								</ProductDetails>
							</ProductWrapper>
						))}
						{order.chosenProductQtyWithVariables.map((product) => (
							<ProductWrapper key={product.name}>
								<ProductImage src={product.image} alt={product.name} />
								<ProductDetails>
									<StyledText>
										<strong>Product Name:</strong> {product.name}
										<span style={{ marginLeft: "20px" }}>
											<strong>Ordered Quantity:</strong>{" "}
											{product.ordered_quantity}
										</span>
										<span style={{ marginLeft: "20px" }}>
											<strong>Price/Unit:</strong> ${product.price}
										</span>
									</StyledText>
									<StyledText>
										<strong>SKU:</strong> {product.chosenAttributes.SubSKU}
										<span style={{ marginLeft: "20px" }}>
											<strong>Color:</strong> {product.chosenAttributes.color}
										</span>
										<span style={{ marginLeft: "20px" }}>
											<strong>Size:</strong> {product.chosenAttributes.size}
										</span>
									</StyledText>
									{product.productImages &&
										product.productImages.length > 0 && (
											<div>
												<StyledText>Product Images:</StyledText>
												{product.productImages.map((img, index) => (
													<img
														key={index}
														src={img.url}
														alt='Product'
														style={{
															width: "100px",
															marginRight: "10px",
														}}
													/>
												))}
											</div>
										)}
									<StyledText>
										<strong>Total Amount:</strong> $
										{(product.ordered_quantity * product.price).toFixed(2)}
									</StyledText>
								</ProductDetails>
							</ProductWrapper>
						))}
					</CardContent>
				</OrderCard>
			))}
		</OrdersWrapper>
	);
};

export default OrdersPage;

const OrdersWrapper = styled.div`
	padding: 20px;
	background-color: var(--background-light);
	color: var(--text-color-primary);

	@media (max-width: 768px) {
		padding: 0px;
		font-size: 13px !important;
	}
`;

const Title = styled.h2`
	color: var(--text-color-primary);
	font-weight: bolder;

	@media (max-width: 768px) {
		padding: 0px !important;
		font-size: 1.5rem !important;
	}
`;

const OrderCard = styled.div`
	border: 1px solid var(--border-color-light);
	border-radius: 5px;
	margin-bottom: 20px;
	background-color: #efefef;
	padding: 16px;
`;

const CardTitle = styled.h3`
	color: var(--text-color-primary);
	font-weight: bolder;

	@media (max-width: 768px) {
		font-size: 1.5rem !important;
		margin: 0px !important;
		text-align: center;
	}
`;

const CardContent = styled.div`
	padding: 16px;

	@media (max-width: 800px) {
		padding: 7px;
	}
`;

const SectionTitle = styled.h4`
	color: var(--text-color-primary);
	margin-top: 20px;
`;

const StyledText = styled.p`
	margin-bottom: 5px;
`;

const CenteredText = styled.p`
	text-align: center;
	font-size: 18px;
	font-weight: bold;
	margin-top: 10px;
	margin-bottom: 10px;
`;

const ProductWrapper = styled.div`
	display: flex;
	margin-bottom: 10px;
`;

const ProductImage = styled.img`
	width: 64px;
	height: 64px;
	object-fit: cover;
	border-radius: 5px;
	margin-right: 10px;
`;

const ProductDetails = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
`;
