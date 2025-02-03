import React, { useEffect, useState } from "react";
import { DatePicker, Table, Button, Input, Modal } from "antd";
import styled from "styled-components";
import CountUp from "react-countup";
import { getListOfOrdersAggregated, getSearchOrder } from "../apiAdmin";
import { isAuthenticated } from "../../auth";
import moment from "moment";

const { RangePicker } = DatePicker;
const { Search } = Input;

const OrdersHistory = ({ showModal }) => {
	const [data, setData] = useState([]);
	const [totalOrders, setTotalOrders] = useState(0);
	const [totalQuantity, setTotalQuantity] = useState(0);
	const [totalAmount, setTotalAmount] = useState(0);
	const [startDate, setStartDate] = useState(moment().subtract(5, "months"));
	const [endDate, setEndDate] = useState(moment());
	const [loading, setLoading] = useState(false);
	const [expandedRowKeys, setExpandedRowKeys] = useState([]);

	// For image modal
	const [modalImage, setModalImage] = useState(null);

	const { user, token } = isAuthenticated();

	// ─────────────────────────────────────────────────────────
	// FETCH ORDERS
	// ─────────────────────────────────────────────────────────
	const fetchOrders = async (start, end) => {
		setLoading(true);

		const page = 1;
		const records = 50;
		const status = "all";
		const userId = user._id;

		// If no start/end, fallback to default 3 months => today
		const startDateStr = start
			? start.format("YYYY-MM-DD")
			: moment().subtract(3, "months").format("YYYY-MM-DD");
		const endDateStr = end
			? end.format("YYYY-MM-DD")
			: moment().format("YYYY-MM-DD");

		try {
			const response = await getListOfOrdersAggregated(
				token,
				page,
				records,
				startDateStr,
				endDateStr,
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

	// ─────────────────────────────────────────────────────────
	// SEARCH ORDERS
	// ─────────────────────────────────────────────────────────
	const handleSearch = async (value) => {
		if (!value) {
			// If search query is empty => re-fetch with current date range
			fetchOrders(startDate, endDate);
		} else {
			setLoading(true);
			try {
				const response = await getSearchOrder(token, value, user._id);
				if (response && response.length) {
					setData(response);
					setTotalOrders(response.length);

					const totalQty = response.reduce(
						(acc, order) => acc + order.totalOrderQty,
						0
					);
					setTotalQuantity(totalQty);

					const totalAmt = response.reduce(
						(acc, order) => acc + order.totalAmountAfterDiscount,
						0
					);
					setTotalAmount(totalAmt);
				} else {
					setData([]);
					setTotalOrders(0);
					setTotalQuantity(0);
					setTotalAmount(0);
				}
			} catch (error) {
				console.error("Error searching orders:", error);
			} finally {
				setLoading(false);
			}
		}
	};

	// ─────────────────────────────────────────────────────────
	// EFFECT: FETCH DATA
	// ─────────────────────────────────────────────────────────
	useEffect(() => {
		fetchOrders(startDate, endDate);
		// eslint-disable-next-line
	}, [startDate, endDate, showModal]);

	// ─────────────────────────────────────────────────────────
	// HELPER: GET PRODUCT IMAGE
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
								onClick={() => setModalImage(displayImg)} // Open modal on click
							/>
							<div>
								<div style={{ fontWeight: "bold" }}>{product.name}</div>
								{/* color / size */}
								{product.chosenAttributes && (
									<div style={{ margin: "2px 0" }}>
										<strong>Color:</strong> {product.chosenAttributes.color} |{" "}
										<strong>Size:</strong> {product.chosenAttributes.size}
									</div>
								)}
								<div>Quantity: {product.ordered_quantity}</div>
								<div>Price: ${product.price}</div>

								{/* POD details */}
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
													{/* Final design preview */}
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
			{/* SCORE CARDS */}
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

			{/* DATE RANGE PICKER & RESET */}
			<div className='my-3 mx-auto text-center'>
				<RangePicker
					className='w-25'
					// Display the 3-month range as default
					value={[startDate, endDate]}
					onChange={(dates) => {
						setStartDate(dates ? dates[0] : null);
						setEndDate(dates ? dates[1] : null);
					}}
				/>
				<Button
					onClick={() => {
						// Reset to entire range => 3 months -> today
						setStartDate(moment().subtract(3, "months"));
						setEndDate(moment());
					}}
					style={{ marginLeft: 10 }}
				>
					Select Last 3 Months
				</Button>
			</div>

			{/* SEARCH BAR */}
			<div className='my-3 mx-auto text-center'>
				<ControlsWrapper className='my-3 mx-auto text-center'>
					<Search
						placeholder='Search Orders'
						onSearch={handleSearch}
						style={{ marginLeft: 10, width: "25%" }}
					/>
				</ControlsWrapper>
			</div>

			{/* DATA TABLE */}
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

			{/* IMAGE PREVIEW MODAL */}
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

export default OrdersHistory;

/* ===================== STYLES ===================== */
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

const ControlsWrapper = styled.div`
	align-items: center;
	margin-bottom: 16px;
`;

const DetailsLink = styled.div`
	color: #1890ff;
	cursor: pointer;
	text-decoration: underline;
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
