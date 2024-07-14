import React, { useEffect, useState } from "react";
import { DatePicker, Table, Button, Input } from "antd";
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
	const [startDate, setStartDate] = useState(null);
	const [endDate, setEndDate] = useState(null);
	const [loading, setLoading] = useState(false);
	const [expandedRowKeys, setExpandedRowKeys] = useState([]);

	const { user, token } = isAuthenticated();

	const fetchOrders = async (start, end) => {
		setLoading(true);

		const page = 1;
		const records = 50;
		const status = "all";
		const userId = user._id;

		const startDate = start
			? start.format("YYYY-MM-DD")
			: moment().startOf("month").format("YYYY-MM-DD");
		const endDate = end
			? end.format("YYYY-MM-DD")
			: moment().endOf("month").format("YYYY-MM-DD");

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

	const handleSearch = async (value) => {
		if (!value) {
			// If search query is empty, fetch regular orders
			fetchOrders(startDate, endDate);
		} else {
			setLoading(true);
			try {
				const response = await getSearchOrder(token, value, user._id);
				if (response && response.length) {
					setData(response);
				} else {
					setData([]);
				}
				setTotalOrders(response.length);
				setTotalQuantity(
					response.reduce((acc, order) => acc + order.totalOrderQty, 0)
				);
				setTotalAmount(
					response.reduce(
						(acc, order) => acc + order.totalAmountAfterDiscount,
						0
					)
				);
			} catch (error) {
				console.error("Error searching orders:", error);
			} finally {
				setLoading(false);
			}
		}
	};

	useEffect(() => {
		fetchOrders(startDate, endDate);
		// eslint-disable-next-line
	}, [startDate, endDate, showModal]);

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
			<div className='my-3 mx-auto text-center'>
				<RangePicker
					className='w-25'
					onChange={(dates) => {
						setStartDate(dates ? dates[0] : null);
						setEndDate(dates ? dates[1] : null);
					}}
				/>

				<Button
					onClick={() => {
						setStartDate(null);
						setEndDate(null);
					}}
					style={{ marginLeft: 10 }}
				>
					Select All
				</Button>
			</div>
			<div className='my-3 mx-auto text-center'>
				<ControlsWrapper className='my-3 mx-auto text-center'>
					<Search
						placeholder='Search Orders'
						onSearch={handleSearch}
						style={{ marginLeft: 10, width: "25%" }}
					/>
				</ControlsWrapper>
			</div>

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

export default OrdersHistory;

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
	/* justify-content: flex-start; */
	align-items: center;
	margin-bottom: 16px;
`;

const DetailsLink = styled.div`
	color: #1890ff;
	cursor: pointer;
	text-decoration: underline;
`;
