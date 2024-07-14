import React, { useState } from "react";
import { Modal, Input, Button, Select } from "antd";
import styled from "styled-components";
import {
	FaBoxOpen,
	FaDollarSign,
	FaReceipt,
	FaTruck,
	FaCalendarAlt,
	FaEdit,
} from "react-icons/fa";
import { updatingAnOrder2 } from "../apiAdmin";
import { isAuthenticated } from "../../auth";
import ProductEditModal from "./ProductEditModal";

const { Option } = Select;

const OrderDetailsModal = ({ isVisible, order, onCancel, setIsVisible }) => {
	const [isEditTrackingModalVisible, setIsEditTrackingModalVisible] =
		useState(false);
	const [isEditStatusModalVisible, setIsEditStatusModalVisible] =
		useState(false);
	const [isEditShipToModalVisible, setIsEditShipToModalVisible] =
		useState(false);
	const [isEditProductModalVisible, setIsEditProductModalVisible] =
		useState(false);
	const [trackingNumber, setTrackingNumber] = useState("");
	const [status, setStatus] = useState(order?.status || "");
	const [customerDetails, setCustomerDetails] = useState(
		order?.customerDetails || {}
	);
	const [selectedProduct, setSelectedProduct] = useState(null);

	const { user, token } = isAuthenticated();

	const handleEditTrackingClick = () => {
		setIsEditTrackingModalVisible(true);
		setTrackingNumber(order.trackingNumber || "");
	};

	const handleEditStatusClick = () => {
		setIsEditStatusModalVisible(true);
		setStatus(order.status || "");
	};

	const handleEditShipToClick = () => {
		setIsEditShipToModalVisible(true);
		setCustomerDetails(order.customerDetails || {});
	};

	const handleEditProductClick = (product) => {
		setSelectedProduct(product);
		setIsEditProductModalVisible(true);
	};

	const handleEditCancel = () => {
		setIsEditTrackingModalVisible(false);
		setIsEditStatusModalVisible(false);
		setIsEditShipToModalVisible(false);
		setIsEditProductModalVisible(false);
		setTrackingNumber("");
		setStatus("");
		setCustomerDetails({});
		setSelectedProduct(null);
	};

	const handleEditTrackingSubmit = async () => {
		try {
			const updatedTrackingNumber = { trackingNumber };
			await updatingAnOrder2(
				order._id,
				user._id,
				token,
				"trackingNumber",
				updatedTrackingNumber
			);
			order.trackingNumber = trackingNumber;
			setIsEditTrackingModalVisible(false);
		} catch (error) {
			console.error("Error updating tracking number:", error);
		}
	};

	const handleEditStatusSubmit = async () => {
		try {
			const updatedStatus = { status };
			await updatingAnOrder2(
				order._id,
				user._id,
				token,
				"status",
				updatedStatus
			);
			order.status = status;
			setIsEditStatusModalVisible(false);
		} catch (error) {
			console.error("Error updating status:", error);
		}
	};

	const handleEditShipToSubmit = async () => {
		try {
			const updatedCustomerDetails = { customerDetails };
			await updatingAnOrder2(
				order._id,
				user._id,
				token,
				"customerDetails",
				updatedCustomerDetails
			);
			order.customerDetails = customerDetails;
			setIsEditShipToModalVisible(false);
		} catch (error) {
			console.error("Error updating customer details:", error);
		}
	};

	const handleProductUpdate = (updatedOrder) => {
		// Update the local order object with the new order data
		Object.assign(order, updatedOrder);
	};

	if (!order) return null;

	return (
		<>
			<Modal
				title={`Order Details - Invoice Number: ${order.invoiceNumber}`}
				open={isVisible}
				onCancel={onCancel}
				footer={null}
				width={"84%"}
				style={{ marginLeft: "15.5%" }}
			>
				<OrderDetailsWrapper>
					<CardContent>
						<div className='col-md-6'>
							<Title>Your Orders</Title>
							<StyledText>
								<FaCalendarAlt style={{ marginRight: "5px" }} />
								<strong>Order Date:</strong>{" "}
								{new Date(order.orderCreationDate).toLocaleDateString()}{" "}
								{new Date(order.orderCreationDate).toLocaleTimeString()}
							</StyledText>
							<StyledText>
								<FaTruck style={{ marginRight: "5px" }} />
								<strong>Tracking Number:</strong>{" "}
								{order.trackingNumber ? (
									<a
										href={order.trackingNumber}
										target='_blank'
										rel='noopener noreferrer'
									>
										Click Here...
									</a>
								) : (
									"No Tracking # Yet"
								)}{" "}
								<FaEdit
									style={{ cursor: "pointer", marginLeft: "10px" }}
									onClick={handleEditTrackingClick}
								/>
							</StyledText>
							<div>
								<FaTruck style={{ marginRight: "5px" }} />
								<strong>Ship To Address:</strong>{" "}
								{order.customerDetails.address}
								{", "}
								{order.customerDetails.city}
								{", "}
								{order.customerDetails.state} {order.customerDetails.zipcode}
							</div>
							<StyledText>
								<FaBoxOpen style={{ marginRight: "5px" }} />
								<strong>Shipment Status:</strong>{" "}
								{order.status.charAt(0).toUpperCase() +
									order.status.slice(1).toLowerCase()}{" "}
								<FaEdit
									style={{ cursor: "pointer", marginLeft: "10px" }}
									onClick={handleEditStatusClick}
								/>
							</StyledText>
							<StyledText>
								<FaReceipt style={{ marginRight: "5px" }} />
								<strong>Ship To:</strong> {order.customerDetails.name}{" "}
								<FaEdit
									style={{ cursor: "pointer", marginLeft: "10px" }}
									onClick={handleEditShipToClick}
								/>
							</StyledText>

							<div className='row'>
								<div className='col-md-6'>
									<span>
										<FaDollarSign style={{ marginRight: "5px" }} />
										<strong>Payment Status:</strong>{" "}
										{order.paymentDetails?.payment?.status?.toLowerCase() ===
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

								<div className='col-md-6'>
									<strong>Customer Comment:</strong> {order.orderComment}
								</div>
							</div>

							<CenteredText>
								<strong>Total Amount:</strong> $
								{Number(order.totalAmount).toFixed(2)}
							</CenteredText>

							<SectionTitle>Payment Details</SectionTitle>

							<div className='row'>
								<div className='col-md-4'>
									<StyledText>
										<FaReceipt style={{ marginRight: "5px" }} />
										<strong>TransactionId:</strong>{" "}
										{order.paymentDetails?.payment?.receiptNumber}
									</StyledText>
								</div>

								<div className='col-md-4'>
									<StyledText>
										<span style={{ marginLeft: "10px" }}>
											<strong>Last4:</strong>{" "}
											{order.paymentDetails?.payment?.cardDetails?.card?.last4}
										</span>
									</StyledText>
								</div>

								<div className='col-md-4'>
									<StyledText>
										<span style={{ marginLeft: "10px" }}>
											<strong>Expiry Date:</strong>{" "}
											{
												order.paymentDetails?.payment?.cardDetails?.card
													?.expMonth
											}
											/
											{
												order.paymentDetails?.payment?.cardDetails?.card
													?.expYear
											}
										</span>
									</StyledText>
								</div>
							</div>
						</div>

						<SectionTitle>
							Products{" "}
							<span
								style={{
									cursor: "pointer",
									marginLeft: "10px",
									fontSize: "18px",
								}}
							>
								(Edit: <FaEdit onClick={() => handleEditProductClick(order)} />)
							</span>
						</SectionTitle>
						{order.productsNoVariable.map((product) => (
							<ProductWrapper key={product.productId}>
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
									<FaEdit
										style={{ cursor: "pointer", marginLeft: "10px" }}
										onClick={() => handleEditProductClick(product)}
									/>
								</ProductDetails>
							</ProductWrapper>
						))}
						{order.chosenProductQtyWithVariables.map((product) => (
							<ProductWrapper key={product.productId}>
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
									<FaEdit
										style={{ cursor: "pointer", marginLeft: "10px" }}
										onClick={() => handleEditProductClick(product)}
									/>
								</ProductDetails>
							</ProductWrapper>
						))}
					</CardContent>
				</OrderDetailsWrapper>
			</Modal>

			<Modal
				title='Edit Tracking Number'
				open={isEditTrackingModalVisible}
				onCancel={handleEditCancel}
				footer={[
					<Button key='cancel' onClick={handleEditCancel}>
						Cancel
					</Button>,
					<Button
						key='submit'
						type='primary'
						onClick={handleEditTrackingSubmit}
					>
						Save
					</Button>,
				]}
			>
				<Input
					placeholder='Enter Tracking Number'
					value={trackingNumber}
					onChange={(e) => setTrackingNumber(e.target.value)}
				/>
			</Modal>

			<Modal
				title='Edit Status'
				open={isEditStatusModalVisible}
				onCancel={handleEditCancel}
				footer={[
					<Button key='cancel' onClick={handleEditCancel}>
						Cancel
					</Button>,
					<Button key='submit' type='primary' onClick={handleEditStatusSubmit}>
						Save
					</Button>,
				]}
			>
				<Select
					placeholder='Select Status'
					value={status}
					onChange={(value) => setStatus(value)}
					style={{ width: "100%" }}
				>
					<Option value='In processing'>In Processing</Option>
					<Option value='Ready To Ship'>Ready To Ship</Option>
					<Option value='Shipped'>Shipped</Option>
					<Option value='Delivered'>Delivered</Option>
					<Option value='Cancelled'>Cancelled</Option>
					<Option value='Backordered'>Backordered</Option>
					<Option value='Onhold'>Onhold</Option>
				</Select>
			</Modal>

			<Modal
				title='Edit Ship To Details'
				open={isEditShipToModalVisible}
				onCancel={handleEditCancel}
				footer={[
					<Button key='cancel' onClick={handleEditCancel}>
						Cancel
					</Button>,
					<Button key='submit' type='primary' onClick={handleEditShipToSubmit}>
						Save
					</Button>,
				]}
			>
				<Input
					placeholder='Name'
					value={customerDetails.name}
					onChange={(e) =>
						setCustomerDetails({ ...customerDetails, name: e.target.value })
					}
					style={{ marginBottom: "10px" }}
				/>
				<Input
					placeholder='Email'
					value={customerDetails.email}
					onChange={(e) =>
						setCustomerDetails({ ...customerDetails, email: e.target.value })
					}
					style={{ marginBottom: "10px" }}
				/>
				<Input
					placeholder='Phone'
					value={customerDetails.phone}
					onChange={(e) =>
						setCustomerDetails({ ...customerDetails, phone: e.target.value })
					}
					style={{ marginBottom: "10px" }}
				/>
				<Input
					placeholder='Address'
					value={customerDetails.address}
					onChange={(e) =>
						setCustomerDetails({ ...customerDetails, address: e.target.value })
					}
					style={{ marginBottom: "10px" }}
				/>
				<Input
					placeholder='State'
					value={customerDetails.state}
					onChange={(e) =>
						setCustomerDetails({ ...customerDetails, state: e.target.value })
					}
					style={{ marginBottom: "10px" }}
				/>
				<Input
					placeholder='Zipcode'
					value={customerDetails.zipcode}
					onChange={(e) =>
						setCustomerDetails({ ...customerDetails, zipcode: e.target.value })
					}
					style={{ marginBottom: "10px" }}
				/>
			</Modal>

			{selectedProduct && (
				<ProductEditModal
					isVisible={isEditProductModalVisible}
					product={selectedProduct}
					order={order}
					onCancel={handleEditCancel}
					onUpdate={handleProductUpdate}
					setIsVisible={setIsEditProductModalVisible}
					setIsVisibleMain={setIsVisible}
				/>
			)}
		</>
	);
};

export default OrderDetailsModal;

const OrderDetailsWrapper = styled.div`
	padding: 20px;
	background-color: #f9f9f9;
	color: #333333;
`;

const CardContent = styled.div`
	padding: 16px;
`;

const Title = styled.h2`
	color: #333333;
	font-weight: bolder;
`;

const SectionTitle = styled.h4`
	color: #333333;
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
