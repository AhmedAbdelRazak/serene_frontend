import React, { useEffect, useState } from "react";
// eslint-disable-next-line
import { DatePicker, Table, Modal } from "antd";
import styled from "styled-components";
import CountUp from "react-countup";
import { getListOfOrdersAggregated } from "../apiAdmin";
import { isAuthenticated } from "../../auth";
import moment from "moment";

const OrdersOverview = ({ showModal }) => {
	const [data, setData] = useState([]);
	const [totalOrders, setTotalOrders] = useState(0);
	const [totalQuantity, setTotalQuantity] = useState(0);
	const [totalAmount, setTotalAmount] = useState(0);
	// eslint-disable-next-line
	const [date, setDate] = useState(moment()); // single-day approach, defaults to today
	const [loading, setLoading] = useState(false);
	const [expandedRowKeys, setExpandedRowKeys] = useState([]);

	// For image preview
	const [modalImage, setModalImage] = useState(null);

	const { user, token } = isAuthenticated();

	// ─────────────────────────────────────────────────────────
	// FETCH
	// ─────────────────────────────────────────────────────────
	const fetchOrders = async (selectedDate) => {
		setLoading(true);

		const page = 1;
		const records = 50;
		const status = "all";
		const userId = user._id;

		const startDate = selectedDate
			? selectedDate.format("YYYY-MM-DD")
			: moment().format("YYYY-MM-DD");
		// For single-day approach, endDate = startDate
		const endDate = startDate;

		try {
			const response = await getListOfOrdersAggregated(
				token,
				page,
				records,
				startDate,
				endDate,
				status,
				userId
			);
			if (response && response.orders) {
				setData(response.orders);
				setTotalOrders(response.totalRecords);
				const totalQty = response.orders.reduce(
					(acc, order) => acc + order.totalOrderQty,
					0
				);
				setTotalQuantity(totalQty);
				const totalAmt = response.orders.reduce(
					(acc, order) => acc + order.totalAmountAfterDiscount,
					0
				);
				setTotalAmount(totalAmt);
			}
		} catch (error) {
			console.error("Error fetching orders:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders(date);
		// eslint-disable-next-line
	}, [date, showModal]);

	// ─────────────────────────────────────────────────────────
	// HELPER: get fallback image
	// ─────────────────────────────────────────────────────────
	const getDisplayImage = (product) => {
		if (product.image && product.image.length > 0) {
			return product.image;
		}
		if (
			product.isPrintifyProduct &&
			product.printifyProductDetails?.POD &&
			product.customDesign?.originalPrintifyImageURL
		) {
			return product.customDesign.originalPrintifyImageURL;
		}
		return "https://via.placeholder.com/50";
	};

	// ─────────────────────────────────────────────────────────
	// EXPANDED ROW
	// ─────────────────────────────────────────────────────────
	const expandedRowRender = (record) => {
		const products = [
			...record.productsNoVariable,
			...record.chosenProductQtyWithVariables,
		];

		return (
			<ExpandedContainer>
				{products.map((product, index) => {
					const displayImg = getDisplayImage(product);
					return (
						<ProductRow key={index}>
							<img
								src={displayImg}
								alt='product'
								style={{
									width: "50px",
									marginRight: 16,
									borderRadius: 5,
									cursor: "pointer",
								}}
								onClick={() => setModalImage(displayImg)}
							/>
							<div>
								<div style={{ fontWeight: "bold" }}>{product.name}</div>
								{/* If chosenAttributes => color / size */}
								{product.chosenAttributes && (
									<div style={{ margin: "2px 0" }}>
										<strong>Color:</strong> {product.chosenAttributes.color} |{" "}
										<strong>Size:</strong> {product.chosenAttributes.size}
									</div>
								)}
								<div>Quantity: {product.ordered_quantity}</div>
								<div>Price: ${product.price}</div>

								{/* POD => design details */}
								{product.isPrintifyProduct &&
									product.printifyProductDetails?.POD && (
										<>
											<div style={{ marginTop: "5px" }}>
												<small>
													<strong>Source:</strong> Print On Demand
												</small>
											</div>
											{product.customDesign && (
												<div style={{ marginTop: "5px" }}>
													{/* Final design */}
													{product.customDesign.finalScreenshotUrl && (
														<>
															<strong>Final Design Preview:</strong>
															<br />
															<img
																src={product.customDesign.finalScreenshotUrl}
																alt='Final Design'
																style={{
																	width: "80px",
																	marginTop: "3px",
																	border: "1px solid #ccc",
																	borderRadius: "5px",
																	cursor: "pointer",
																}}
																onClick={() =>
																	setModalImage(
																		product.customDesign.finalScreenshotUrl
																	)
																}
															/>
														</>
													)}
													{/* Custom texts */}
													{product.customDesign.texts &&
														product.customDesign.texts.length > 0 && (
															<div style={{ marginTop: "5px" }}>
																<strong>Custom Text(s):</strong>
																<ul>
																	{product.customDesign.texts.map((txt, i) => (
																		<li key={i}>
																			<strong>Text:</strong> {txt.text}, Color:{" "}
																			{txt.color}
																		</li>
																	))}
																</ul>
															</div>
														)}
												</div>
											)}
										</>
									)}
							</div>
						</ProductRow>
					);
				})}
			</ExpandedContainer>
		);
	};

	const handleExpand = (expanded, record) => {
		setExpandedRowKeys(expanded ? [record._id] : []);
	};

	// ─────────────────────────────────────────────────────────
	// TABLE COLUMNS
	// ─────────────────────────────────────────────────────────
	const columns = [
		{
			title: "#",
			dataIndex: "index",
			key: "index",
			render: (_, __, index) => index + 1,
		},
		{
			title: "Customer Name",
			dataIndex: ["customerDetails", "name"],
			key: "customerName",
		},
		{
			title: "Customer Phone",
			dataIndex: ["customerDetails", "phone"],
			key: "customerPhone",
		},
		{
			title: "Customer State",
			dataIndex: ["customerDetails", "state"],
			key: "customerState",
		},
		{
			title: "Customer Address",
			dataIndex: ["customerDetails", "address"],
			key: "customerAddress",
		},
		{
			title: "Status",
			dataIndex: "status",
			key: "status",
			render: (text) => text.charAt(0).toUpperCase() + text.slice(1),
		},
		{
			title: "Invoice Number",
			dataIndex: "invoiceNumber",
			key: "invoiceNumber",
		},
		{
			title: "Tracking Number",
			dataIndex: "trackingNumber",
			key: "trackingNumber",
			render: (_, record) => {
				if (record.printifyOrderDetails && record.printifyOrderDetails.id) {
					return record.trackingNumber ? (
						<a
							href={record.trackingNumber}
							target='_blank'
							rel='noopener noreferrer'
						>
							Click Here...
						</a>
					) : (
						"No Tracking #"
					);
				}
				return record.trackingNumber ? record.trackingNumber : "No Tracking #";
			},
		},
		{
			title: "Order Details",
			key: "details",
			render: (_, record) => (
				<DetailsLink onClick={() => showModal(record)}>
					Show Details
				</DetailsLink>
			),
		},
	];

	// ─────────────────────────────────────────────────────────
	// RENDER
	// ─────────────────────────────────────────────────────────
	return (
		<>
			<ScoreCardsWrapper>
				<Card bgColor='#2f556b'>
					<Title>Total Orders</Title>
					<Count>
						<CountUp
							start={0}
							end={totalOrders}
							duration={1.5}
							separator=','
							decimals={0}
						/>
					</Count>
				</Card>
				<Card bgColor='#6b452f'>
					<Title>Total Quantity</Title>
					<Count>
						<CountUp
							start={0}
							end={totalQuantity}
							duration={2}
							separator=','
							decimals={0}
						/>
					</Count>
				</Card>
				<Card bgColor='#376b2f'>
					<Title>Total Amount $</Title>
					<Count>
						<CountUp
							start={0}
							end={totalAmount}
							duration={2.5}
							separator=','
							decimals={2}
							prefix='$'
						/>
					</Count>
				</Card>
			</ScoreCardsWrapper>

			{/* If you want to enable date picking for single-day, uncomment: 
      <StyledDatePickerContainer>
        <span style={{ fontWeight: "bold" }}>
          Selected Date: {date.format("YYYY-MM-DD")}
        </span>
        <DatePicker
          style={{ marginTop: 16, width: "100%" }}
          onChange={(selected) => setDate(selected || moment())}
          value={date}
          disabledDate={(current) => current && current > moment().endOf("day")}
        />
      </StyledDatePickerContainer>
      */}

			<Table
				columns={columns}
				dataSource={data}
				loading={loading}
				expandedRowRender={expandedRowRender}
				expandedRowKeys={expandedRowKeys}
				onExpand={handleExpand}
				rowKey={(record) => record._id}
				style={{ marginTop: 16 }}
			/>

			{/* IMAGE MODAL */}
			<Modal
				open={!!modalImage}
				onCancel={() => setModalImage(null)}
				footer={null}
				closable={true}
				centered
				width='auto'
				bodyStyle={{ padding: "10px", textAlign: "center" }}
			>
				{modalImage && (
					<img
						src={modalImage}
						alt='Full Preview'
						style={{
							maxWidth: "90vw",
							maxHeight: "80vh",
							objectFit: "contain",
						}}
					/>
				)}
			</Modal>
		</>
	);
};

export default OrdersOverview;

/* ============ STYLES ============ */
const ScoreCardsWrapper = styled.div`
	display: flex;
	justify-content: space-around;
	margin: 20px 0;
`;

const Card = styled.div`
	background-color: ${(props) => props.bgColor};
	color: white;
	padding: 10px;
	margin: 10px;
	border-radius: 10px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	text-align: center;
	width: 25%;
	transition: transform 0.3s ease;

	&:hover {
		transform: scale(1.05);
	}
`;

const Title = styled.div`
	font-size: 1.2em;
	font-weight: bold;
	margin-bottom: 10px;
`;

const Count = styled.div`
	font-size: 1.7rem;
	font-weight: bold;
`;

const DetailsLink = styled.div`
	color: #1890ff;
	cursor: pointer;
	text-decoration: underline;
`;

// eslint-disable-next-line
const StyledDatePickerContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 16px;
	width: 50%;
	margin: auto;

	span {
		font-size: 1.2em;
		margin-bottom: 8px;
	}
	.ant-picker {
		width: 100%;
	}
`;

const ExpandedContainer = styled.div`
	padding: 10px;
`;

const ProductRow = styled.div`
	display: flex;
	align-items: flex-start;
	margin-bottom: 8px;
	border-bottom: 1px dashed #ccc;
	padding-bottom: 8px;

	&:last-child {
		border-bottom: none;
	}
`;
