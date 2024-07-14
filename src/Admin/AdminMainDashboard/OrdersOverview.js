import React, { useEffect, useState } from "react";
// eslint-disable-next-line
import { DatePicker, Table } from "antd";
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
	const [date, setDate] = useState(moment()); // Initialize with current date
	const [loading, setLoading] = useState(false);
	const [expandedRowKeys, setExpandedRowKeys] = useState([]);

	const { user, token } = isAuthenticated();

	const fetchOrders = async (selectedDate) => {
		setLoading(true);

		const page = 1;
		const records = 50;
		const status = "all";
		const userId = user._id; // replace with actual user ID

		const startDate = selectedDate
			? selectedDate.format("YYYY-MM-DD")
			: moment().format("YYYY-MM-DD");
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
				setTotalQuantity(
					response.orders.reduce((acc, order) => acc + order.totalOrderQty, 0)
				);
				setTotalAmount(
					response.orders.reduce(
						(acc, order) => acc + order.totalAmountAfterDiscount,
						0
					)
				);
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

	const expandedRowRender = (record) => {
		const products = [
			...record.productsNoVariable,
			...record.chosenProductQtyWithVariables,
		];
		return (
			<>
				{products.map((product, index) => (
					<div
						key={index}
						style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
					>
						<img
							src={product.image}
							alt='product'
							style={{ width: "50px", marginRight: 16 }}
						/>
						<div>
							<div>{product.name}</div>
							<div>Quantity: {product.ordered_quantity}</div>
							<div>Price: ${product.price}</div>
						</div>
					</div>
				))}
			</>
		);
	};

	const handleExpand = (expanded, record) => {
		setExpandedRowKeys(expanded ? [record._id] : []);
	};

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
			{/* <StyledDatePickerContainer>
				<span style={{ fontWeight: "bold" }}>
					Selected Date: {date.format("YYYY-MM-DD")}
				</span>
				<DatePicker
					style={{ marginTop: 16, width: "100%" }}
					onChange={(date) => setDate(date || moment())}
					value={date}
					disabledDate={(current) => current && current > moment().endOf("day")}
				/>
			</StyledDatePickerContainer> */}
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
		</>
	);
};

export default OrdersOverview;

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
